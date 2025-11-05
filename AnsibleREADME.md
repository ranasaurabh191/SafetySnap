# BREAK IT: Uninstall django from venv

/mnt/d/PROJECTS/SafetySnap/venv/Scripts/pip.exe uninstall django -y


# verify

ansible-playbook ~/ansible/playbooks/verify_safetysnap.yml -i ~/ansible/inventories/hosts.ini



# Ansible auto-fixes

ansible-playbook ~/ansible/playbooks/auto_fix_django.yml -i ~/ansible/inventories/hosts.ini


