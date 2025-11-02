# BREAK IT: Uninstall django from venv
/mnt/d/PROJECTS/SafetySnap/venv/Scripts/pip.exe uninstall django -y

# stop and restart the django server
will show an error


ansible-playbook ~/ansible/playbooks/verify_safetysnap.yml -i ~/ansible/inventories/hosts.ini
# Shows: Django DOWN ❌


ansible-playbook ~/ansible/playbooks/auto_fix_django.yml -i ~/ansible/inventories/hosts.ini
# Ansible auto-fixes

now restart the django server


# verify 
ansible-playbook ~/ansible/playbooks/verify_safetysnap.yml -i ~/ansible/inventories/hosts.ini


