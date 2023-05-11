# QA Tools

These are simple scripts to help manage a QA workflow by fetching open GitHub
issues and categorizing them.

To fetch all the issues, in a terminal enter:

    source fetch-issues.sh

(This uses the GitHub REST API which has a usage limit, so be careful about that.)

To put the categorized issues in a file, enter:

    node show-issues.js > issues.txt

If you open `issues.txt` in a smart editor like Visual Studio Code, then you can click on links.
