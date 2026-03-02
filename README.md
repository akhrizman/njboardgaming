# NJ Boardgames

This website is built with **Jekyll** and deployed using **GitHub Pages**.  
These instructions explain how to **run the site locally on macOS (Apple Silicon / M1+)**.

---

## 🚀 Local Development

### Prerequisites
- macOS
- Terminal access
- Git installed

> ⚠️ Do **not** use the system Ruby that comes with macOS.

---

### 1. Install Homebrew
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Verify
brew --version
```

### 1. Install Ruby
```bash
# Install Ruby version manager
brew install rbenv ruby-build

# Enable Ruby in the shell
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc

# Verify ruby version
rbenv --version

# Install Ruby version used by this project (currently 3.2.10)
rbenv install 3.2.10

# Verify Ruby is correct (if /usr/bin/ruby appers, rbenv is NOT active!
which ruby
ruby -v
```

### 2. Build & Run the site
```bash
# Run the site locally
bundle exec jekyll serve
```

- Site sould now be hosted at http://localhost:4000

- Jekyll will automatically rebuild when files change.

