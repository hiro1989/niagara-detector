# bash history (persist across container rebuilds)
export HISTFILE="$HOME/.bash_persistent/.bash_history"
export HISTSIZE=10000
export HISTFILESIZE=20000
export HISTCONTROL=ignoreboth:erasedups  # ignore spaces, duplicates, and erase older dupes
shopt -s histappend
export PROMPT_COMMAND="history -a; ${PROMPT_COMMAND:-}"  # write history immediately after each command

# mise
eval "$(mise activate bash)"

# starship
eval "$(starship init bash)"

# fzf (ctrl+r for history search)
export PATH="$HOME/.fzf/bin:$PATH"
eval "$(fzf --bash)"

# aliases
alias l='ls -alh1F'
alias ll='ls -alhF'
alias c='claude --model opus'
alias co='claude --model opus'
alias cs='claude --model sonnet'
alias cresume='claude --continue'
