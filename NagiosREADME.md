
## To activate the new configuration, you need to run:
systemctl restart apache2
Enabling module cgi.
## To activate the new configuration, you need to run:
  systemctl restart apache2


123 pswd

WSL2 Ubuntu (22.04+)

SafetySnap running on Windows

Apache web server

Python 3.11+

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y wget build-essential apache2 php libapache2-mod-php \
  php-gd libgd-dev unzip autoconf gcc libc6 make apache2-utils \
  libssl-dev bc gawk dc snmp libnet-snmp-perl gettext python3-requests

# Create Nagios user and groups
sudo useradd nagios
sudo groupadd nagcmd
sudo usermod -a -G nagcmd nagios
sudo usermod -a -G nagcmd www-data

# Download Nagios Core 4.5.3
cd /tmp
wget https://assets.nagios.com/downloads/nagioscore/releases/nagios-4.5.3.tar.gz
tar -xzf nagios-4.5.3.tar.gz
cd nagios-4.5.3

# Compile and install
./configure --with-nagios-group=nagios --with-command-group=nagcmd
make all
sudo make install
sudo make install-init
sudo make install-commandmode
sudo make install-config
sudo make install-webconf

# Enable Apache modules
sudo a2enmod rewrite
sudo a2enmod cgi

# Install Nagios Plugins
cd /tmp
wget https://nagios-plugins.org/download/nagios-plugins-2.4.10.tar.gz
tar -xzf nagios-plugins-2.4.10.tar.gz
cd nagios-plugins-2.4.10
./configure --with-nagios-user=nagios --with-nagios-group=nagios
make
sudo make install

# Set admin password
sudo htpasswd -c /usr/local/nagios/etc/htpasswd.users nagiosadmin

# Fix permissions
sudo chown -R nagios:nagios /usr/local/nagios/
sudo chmod 775 /usr/local/nagios/var/rw
sudo chown nagios:www-data /usr/local/nagios/var/rw



sudo mkdir -p /usr/local/nagios/etc/objects/safetysnap
sudo nano /usr/local/nagios/etc/objects/safetysnap/safetysnap.cfg

### config file

###############################################################################
# SafetySnap Application Monitoring Configuration
###############################################################################

# Define the SafetySnap host (Windows)
define host {
    use                     linux-server
    host_name               safetysnap-local
    alias                   SafetySnap Development Server
    address                 172.18.32.1
    max_check_attempts      3
    check_period            24x7
    notification_interval   30
    notification_period     24x7
}

# Service: SafetySnap Custom Health Check
define service {
    use                     local-service
    host_name               safetysnap-local
    service_description     SafetySnap Application Health
    check_command           check_safetysnap_health
    notifications_enabled   1
    check_interval          2
}

# Service: Django Backend API
define service {
    use                     local-service
    host_name               safetysnap-local
    service_description     Django Backend API
    check_command           check_http!-I 172.18.32.1 -p 8000 -u /api/health/ -e 200
    notifications_enabled   1
    check_interval          2
}

# Service: React Frontend
define service {
    use                     local-service
    host_name               safetysnap-local
    service_description     React Frontend
    check_command           check_http!-I 172.18.32.1 -p 5173
    notifications_enabled   1
    check_interval          2
}

# Service: PostgreSQL Database
define service {
    use                     local-service
    host_name               safetysnap-local
    service_description     PostgreSQL Database
    check_command           check_tcp_custom!172.18.32.1!5432
    notifications_enabled   1
    check_interval          5
}

# Service: CPU Load
define service {
    use                     local-service
    host_name               safetysnap-local
    service_description     CPU Load
    check_command           check_local_load!5.0,4.0,3.0!10.0,6.0,4.0
    notifications_enabled   1
    check_interval          5
}

# Service: Disk Usage
define service {
    use                     local-service
    host_name               safetysnap-local
    service_description     Root Partition Disk Usage
    check_command           check_local_disk!20%!10%!/
    notifications_enabled   1
    check_interval          10
}

# Service: Memory Usage
define service {
    use                     local-service
    host_name               safetysnap-local
    service_description     Memory Usage
    check_command           check_local_swap!20%!10%
    notifications_enabled   1
    check_interval          5
}



## 2. Custom Health Check Plugin
sudo nano /usr/local/nagios/libexec/check_safetysnap_health.py

#!/usr/bin/env python3
"""
Custom Nagios plugin for SafetySnap health monitoring
"""
import sys
import requests
import json
import subprocess

STATE_OK = 0
STATE_WARNING = 1
STATE_CRITICAL = 2
STATE_UNKNOWN = 3

def get_windows_host_ip():
    """Get Windows host IP from WSL using ip route"""
    try:
        result = subprocess.run(
            ['ip', 'route', 'show', 'default'],
            capture_output=True,
            text=True,
            timeout=2
        )
        
        for line in result.stdout.split('\n'):
            if 'default via' in line:
                parts = line.split()
                if len(parts) >= 3:
                    return parts[2]
    except Exception:
        pass
    
    return 'localhost'

def check_health():
    host_ip = get_windows_host_ip()
    url = f'http://{host_ip}:8000/api/health/'
    
    try:
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('status') == 'healthy':
                if not data.get('model_loaded'):
                    print(f"WARNING: YOLO model not loaded")
                    return STATE_WARNING
                
                if not data.get('media_writable'):
                    print(f"WARNING: Media directory not writable")
                    return STATE_WARNING
                
                print(f"OK: SafetySnap is healthy - DB: {data.get('database')}, Model: {data.get('model_loaded')}, URL: {url}")
                return STATE_OK
            else:
                print(f"CRITICAL: Application unhealthy - {data.get('error', 'Unknown')}")
                return STATE_CRITICAL
                
        elif response.status_code == 503:
            data = response.json()
            print(f"WARNING: Service degraded - {json.dumps(data)}")
            return STATE_WARNING
        else:
            print(f"CRITICAL: Unexpected status code {response.status_code}")
            return STATE_CRITICAL
            
    except requests.exceptions.Timeout:
        print(f"CRITICAL: Health check timeout (>5s) - URL: {url}")
        return STATE_CRITICAL
    except requests.exceptions.ConnectionError:
        print(f"CRITICAL: Cannot connect to SafetySnap API at {url}")
        return STATE_CRITICAL
    except Exception as e:
        print(f"UNKNOWN: {str(e)}")
        return STATE_UNKNOWN

if __name__ == '__main__':
    exit_code = check_health()
    sys.exit(exit_code)



sudo chmod +x /usr/local/nagios/libexec/check_safetysnap_health.py

## 3. Add Custom Commands
sudo nano /usr/local/nagios/etc/objects/commands.cfg

################################################################################
# SafetySnap Custom Commands
################################################################################

# SafetySnap Health Check Command
define command {
    command_name    check_safetysnap_health
    command_line    /usr/local/nagios/libexec/check_safetysnap_health.py
}

# Custom TCP check with explicit host
define command {
    command_name    check_tcp_custom
    command_line    $USER1$/check_tcp -H $ARG1$ -p $ARG2$
}



## 4. Enable SafetySnap Config in Main Nagios
sudo nano /usr/local/nagios/etc/nagios.cfg


cfg_file=/usr/local/nagios/etc/objects/safetysnap/safetysnap.cfg




Start Nagios (WSL):


# Start Nagios
sudo service nagios start

# Stop Nagios
sudo service nagios stop

# Restart Nagios
sudo service nagios restart

# Check status
sudo service nagios status

# View logs
sudo tail -f /usr/local/nagios/var/nagios.log

# View recent alerts
sudo grep "SERVICE ALERT" /usr/local/nagios/var/nagios.log | tail -20


http://localhost/nagios

nagiosadmin
123


### Configuration Management

# Verify configuration
sudo /usr/local/nagios/bin/nagios -v /usr/local/nagios/etc/nagios.cfg

# Edit SafetySnap config
sudo nano /usr/local/nagios/etc/objects/safetysnap/safetysnap.cfg

# Edit commands
sudo nano /usr/local/nagios/etc/objects/commands.cfg

# for notifications
sudo nano /usr/local/nagios/etc/objects/localhost.cfg

# After config changes:
sudo /usr/local/nagios/bin/nagios -v /usr/local/nagios/etc/nagios.cfg
sudo service nagios restart


### Manual Testing

# Test custom health check
sudo /usr/local/nagios/libexec/check_safetysnap_health.py

# Test Django API
/usr/local/nagios/libexec/check_http -I 172.18.32.1 -p 8000 -u /api/health/

# Test React Frontend
/usr/local/nagios/libexec/check_http -I 172.18.32.1 -p 5173

# Test PostgreSQL
/usr/local/nagios/libexec/check_tcp -H 172.18.32.1 -p 5432

# Test from curl
curl http://172.18.32.1:8000/api/health/


### If Services Showing CRITICAL
# Verify Windows services are running
netstat -an | findstr "8000"  # Django
netstat -an | findstr "5173"  # React
netstat -an | findstr "5432"  # PostgreSQL

# Test connectivity from WSL
curl http://172.18.32.1:8000/api/health/
curl http://172.18.32.1:5173
nc -zv 172.18.32.1 5432

# Check Windows Firewall
# Run PowerShell as Administrator:
New-NetFirewallRule -DisplayName "Django Dev" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
New-NetFirewallRule -DisplayName "Vite Dev" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow


# Live checkning
watch -n 5 'sudo /usr/local/nagios/bin/nagiostats | grep -A 3 "Active Service"'
