const fs = require('fs');

const staff = ["costinberty", "D4ryl00", "dependabot[bot]", "dework-integration[bot]",
    "gfanton", "iuricmp", "jefft0",  "moul", "berty-assistant"];

function main() {
    const headers = ["NEEDS QA ATTENTION", "MORE INFO NEEDED", "HAS DEV FOCUS", "BACKLOG OR DRAFT"]
    const repos = ["berty", "weshnet", "weshnet-expo", "weshnet-expo-examples", "go-orbit-db", "go-ipfs-log", "gomobile-ipfs", "www.berty.tech", "www.wesh.network"];

    for (const header of headers) {
        let total = 0;
        let oldest = new Date();
    
        for (const repo of repos) {
            result = showIssues(repo, header);
            total += result.total;
            if (result.oldest < oldest)
                oldest = result.oldest;
        }

        if (total == 0)
            console.log("\n" + header + ":")
        console.log("\n              Total: " + total);
        console.log("             Oldest: " + oldest.toISOString());
    }
}

/**
 * Read the JSON files for the repo and show all the issues for the header.
 * @returns An object with total and oldest for the shown issues.
 */
function showIssues(repo, header) {
    let showBacklogOrDraft = false;
    let showMoreInfoNeeded = false;
    let showHasDevFocus = false;
    if (header == "BACKLOG OR DRAFT")
        showBacklogOrDraft = true;
    else if (header == "MORE INFO NEEDED")
        showMoreInfoNeeded = true;
    else if (header == "HAS DEV FOCUS")
        showHasDevFocus = true;
    else {
        if (header != "NEEDS QA ATTENTION") {
            console.log("ERROR: Unrecognised header: " + header);
            return;
        }
    }

    let text = fs.readFileSync(repo + ".issues.json", 'utf8');
    const blankResult = "[\n\n]\n";
    if (text.endsWith(blankResult))
        // The second fetched "page" of issues is blank.
        text = text.substring(0, text.length - blankResult.length);
    // Replace the boundary between two pages of results.
    text = text.replaceAll('\n]\n[\n', ',\n');
    if (text == "")
        text = "[]";
    const issues = JSON.parse(text);

    text = fs.readFileSync(repo + ".pulls.json", 'utf8');
    if (text.endsWith(blankResult))
        // The second fetched "page" of issues is blank.
        text = text.substring(0, text.length - blankResult.length);
    // Replace the boundary between two pages of results.
    text = text.replaceAll('\n]\n[\n', ',\n');    
    if (text == "")
        text = "[]";
    const pulls = JSON.parse(text);

    let total = 0;
    let now = new Date();
    let oldest = now;
    let showedHeader = false;
    for (const issue of issues) {
        const isBacklog = hasLabel(issue, "backlog");
        const isPullRequest = (issue.pull_request !== undefined);
        const isBug = hasLabel(issue, "bug");
        const isFeatureRequest = hasLabel(issue, ":rocket: feature-request");
        const isQuestion = hasLabel(issue, "question");
        const isApproved = hasLabel(issue, "✅ Approved");
        const isVerified = hasLabel(issue, "verified");
        const isMoreInfoNeeded = hasLabel(issue, "more info needed");
        const url = "https://github.com/" + (repo == "gomobile-ipfs" ? "ipfs-shipyard" : "berty") + "/" + repo +
            (isPullRequest ? "/pull/" : "/issues/") + issue.number;

        const user = issue.user.login;
        const createdAt = new Date(issue.created_at);
        const updatedAt = new Date(issue.updated_at);
        let daysSinceUpdate = (now - updatedAt) / (1000 * 3600 * 24);
        if (repo == "www.berty.tech" && issue.number == 9)
            // temporary
            daysSinceUpdate += 7
        const assignee = (issue.assignee ? issue.assignee.login : null);

        let pull = null;
        let hasReviewer = false;
        let isDraft = false;
        if (isPullRequest) {
            pull = getPull(pulls, issue.number);
            if (pull == null)
                // (We don't expect this.)
                console.log("  WARNING: Can't find pull request detail: " + url);
            else {
                hasReviewer = (pull.requested_reviewers.length > 0);
                isDraft = pull.draft;
            }
        }

        const isBacklogOrDraft = (isBacklog || isDraft);
        const hasDevFocus = (isPullRequest ? hasReviewer : !!assignee);

        if (isBacklogOrDraft != showBacklogOrDraft)
            continue;
        if (!isBacklogOrDraft) {
            if (isMoreInfoNeeded != showMoreInfoNeeded)
                continue;
            if (!isMoreInfoNeeded) {
                if (hasDevFocus != showHasDevFocus)
                    continue;
            }
        }

        ++total;

        if (!showedHeader) {
            console.log("\n" + header + ": " + repo);
            showedHeader = true;
        }

        if (createdAt < oldest)
            oldest = createdAt;

        // Wait until 21 days pass for a response.
        const daysRemaining = (isMoreInfoNeeded ? String(Math.max(0, Math.ceil(21 - daysSinceUpdate))).padStart(2, '0') + "d " : "")
        let category = "    ";
        if (isPullRequest)
            category = "pull";
        else if (isBug)
            category = isVerified ? "vbug" : "bug ";
        else if (isFeatureRequest)
            category = isApproved ? "appf" : "feat";
        else if (isQuestion)
            category = "ques";
        console.log(daysRemaining + category + " " + url + " ".repeat(4 - ("" + issue.number).length) +
                    (isPullRequest ? "   " : " ") + createdAt.toISOString() + " " + issue.comments + " comments, " +
                    user + ", " + issue.title);
        if (assignee && !staff.includes(assignee))
          console.log("  WARNING: #" + issue.number + " is assigned to non staff member " + assignee);
        if (showBacklogOrDraft) {
            if (isBacklogOrDraft && isMoreInfoNeeded)
                console.log("  WARNING: #" + issue.number + " has both backlog (or draft) and more-info-needed");
            if (isBacklogOrDraft && hasDevFocus && isPullRequest) {
                if (isDraft)
                    console.log("  WARNING: draft PR #" + issue.number + " has a reviewer");
                else
                    console.log("  WARNING: backlog PR #" + issue.number + " has a reviewer");
            }
        }
        if (isVerified && !isBug)
            console.log("  WARNING: non-bug #" + issue.number + " has the 'verified' label");
        if (isApproved && !isFeatureRequest)
            console.log("  WARNING: non-feature request #" + issue.number + " has the 'approved' label");
        if (showHasDevFocus && !isPullRequest && issue.assignees.length > 1)
            console.log("  WARNING: #" + issue.number + " is assigned to multiple devs: " + issue.assignees.length);
        if (isPullRequest && pull.requested_reviewers.length > 1)
            console.log("  WARNING: PR #" + issue.number + " has multiple reviewers: " + pull.requested_reviewers.length);
        if (isPullRequest && pull.requested_teams.length > 0)
            console.log("  WARNING: PR #" + issue.number + " has a team as a reviewer");
        if (isPullRequest && isBacklog)
            console.log("  WARNING: PR #" + issue.number + " has the 'backlog' label");
        if (isPullRequest && isBug)
            console.log("  WARNING: PR #" + issue.number + " has the 'bug' label");
    }

    return { total: total, oldest: oldest}
}

function getPull(pulls, number) {
    for (const pull of pulls) {
        if (pull.number == number)
            return pull;
    }

    return null;
}

function hasLabel(issue, labelName) {
  for (label of issue.labels) {
      if (label.name == labelName)
          return true;
  }

  return false;
}

main();
