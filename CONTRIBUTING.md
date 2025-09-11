# Contributing to QDAM

Thank you for your interest in contributing to QDAM! This document provides guidelines and information for contributors.

## How to Get Repository Access

### Requesting Invitation

If you want to contribute to this project, you can request access in several ways:

1. **Open an Issue:** Create a new issue with the title "Request for Collaboration Access" and include:
   - Your GitHub username
   - Brief description of your background
   - How you'd like to contribute to the project
   - Any relevant experience or skills

2. **Contact the Maintainer:** Reach out directly to [@Skyshmallow](https://github.com/Skyshmallow) with your request

3. **Email:** If you have the maintainer's contact information, you can email them directly

### Getting Invited by Repository Owners

Repository owners can invite collaborators using these methods:

#### Via GitHub Web Interface
1. Navigate to the repository: `https://github.com/Skyshmallow/qdam`
2. Go to Settings → Collaborators and teams
3. Click "Add people"
4. Enter the collaborator's GitHub username or email
5. Select appropriate permission level:
   - **Read:** Can view and clone the repository
   - **Write:** Can view, clone, and push to the repository
   - **Admin:** Full access including settings and collaborator management
6. Click "Add [username] to this repository"

#### Via GitHub CLI
```bash
# Invite with write access
gh repo invite <username> --repo Skyshmallow/qdam --permission write

# Invite with read access  
gh repo invite <username> --repo Skyshmallow/qdam --permission read

# Invite with admin access
gh repo invite <username> --repo Skyshmallow/qdam --permission admin
```

#### Via GitHub API
```bash
curl -X PUT \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/Skyshmallow/qdam/collaborators/USERNAME \
  -d '{"permission":"write"}'
```

## Collaboration Guidelines

### Getting Started
Once you have access to the repository:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Skyshmallow/qdam.git
   cd qdam
   ```

2. **Create a new branch for your work:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes and commit:**
   ```bash
   git add .
   git commit -m "Descriptive commit message"
   ```

4. **Push your branch and create a pull request:**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Standards
- Write clear, descriptive commit messages
- Follow existing code style and conventions
- Include appropriate documentation for new features
- Add tests where applicable

### Communication
- Use issues to discuss bugs, features, and improvements
- Be respectful and constructive in all communications
- Ask questions if you're unsure about anything

## Types of Contributions

We welcome various types of contributions:
- Bug fixes
- Feature implementations
- Documentation improvements
- Code refactoring
- Testing improvements
- Performance optimizations

## Questions?

If you have any questions about contributing or need help getting started:
- Create an issue with the "question" label
- Contact [@Skyshmallow](https://github.com/Skyshmallow)
- Check existing issues to see if your question has been answered

Thank you for contributing to QDAM!