FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    jq \
    && rm -rf /var/lib/apt/lists/*

# fzf (install from git to get latest version with --bash support)
RUN git clone --depth 1 https://github.com/junegunn/fzf.git /home/vscode/.fzf \
    && chown -R vscode:vscode /home/vscode/.fzf \
    && su vscode -c '/home/vscode/.fzf/install --bin'

# starship
RUN curl -fsSL https://starship.rs/install.sh | sh -s -- --yes
