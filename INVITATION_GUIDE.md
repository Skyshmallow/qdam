# Quick Guide: Getting Invitation Links for QDAM

This guide provides quick instructions for getting invitation links to collaborate on the QDAM project.

## For People Wanting Access

### Option 1: Use GitHub Issue Template
1. Go to [https://github.com/Skyshmallow/qdam/issues/new/choose](https://github.com/Skyshmallow/qdam/issues/new/choose)
2. Select "Request Repository Access"
3. Fill out the form with your information
4. Submit the issue

### Option 2: Direct Contact
- Contact [@Skyshmallow](https://github.com/Skyshmallow) directly
- Include your GitHub username and how you'd like to contribute

## For Repository Owners

### Generate Invitation Links

#### Method 1: GitHub Web Interface
1. Go to: [https://github.com/Skyshmallow/qdam/settings/collaborators](https://github.com/Skyshmallow/qdam/settings/collaborators)
2. Click "Add people"
3. Enter username/email and select permissions
4. The system will generate an invitation link automatically

#### Method 2: GitHub CLI
```bash
# Install GitHub CLI if not already installed
# Then run:
gh repo invite USERNAME --repo Skyshmallow/qdam --permission write
```

#### Method 3: GitHub API
```bash
curl -X PUT \
  -H "Authorization: token YOUR_PERSONAL_ACCESS_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/Skyshmallow/qdam/collaborators/USERNAME \
  -d '{"permission":"write"}'
```

## Permission Levels

- **Read**: View and clone repository
- **Write**: View, clone, and contribute code  
- **Admin**: Full repository access including settings

## Repository URLs

- **GitHub Page**: https://github.com/Skyshmallow/qdam
- **Clone HTTPS**: https://github.com/Skyshmallow/qdam.git
- **Clone SSH**: git@github.com:Skyshmallow/qdam.git

## Need Help?

Create an issue using our templates or contact the repository owner directly!