const fs = require('fs');

const staff = ["costinberty", "D4ryl00", "dependabot[bot]", "dework-integration[bot]",
    "gfanton", "iuricmp", "jefft0",  "moul", "berty-assistant"];
// coreDevs should track https://github.com/orgs/gnolang/teams/tech-staff
const coreDevs = ['aeddi', 'ajnavarro', 'gfanton', 'ilgooz', 'jaekwon', 'Kouteki', 'kristovatlas',
    'ltzmaxwell', 'masonmcbride', 'michelleellen', 'moul', 'mvertes', 'n2p5', 'petar-dambovaliev', 'piux2', 'stackdump', 'sw360cab',
    'thehowl', 'zivkovicmilos'];
// Not in https://github.com/orgs/gnolang/teams/tech-staff : albttx, alexiscolin, carlopezzuto, deelawn, jeronimoalbi, mazzy89, salmad3
const triageReviewers = ['jefft0', 'leohhhn', 'n0izn0iz', 'notJoon', 'omarsy', 'wyhaines', 'x1unix'];
    
function main() {
    const headers = ["NEEDS QA ATTENTION", "MORE INFO NEEDED", "HAS DEV FOCUS", "BACKLOG OR DRAFT"]
    const repos = ["berty", "weshnet", "weshnet-expo", "weshnet-expo-examples", "go-orbit-db", "go-ipfs-log", "ui-components",
                   "gnonative", "gnokey-mobile", "dsocial", "www.berty.tech", "www.wesh.network", "gomobile-ipfs"];

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
        console.log("             Oldest: " + oldest.toISOString().substring(0, 10));
    }

    result = showGnoPRs();
    console.log("\n Total: " + result.total);
    console.log("Oldest: " + result.oldest.toISOString().substring(0, 10));
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

    const issues = readJsonFile(repo + ".issues.json");
    const pulls = readJsonFile(repo + ".pulls.json");

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
        const url = "https://github.com/" + 
            (repo == "gomobile-ipfs" ? "ipfs-shipyard" : (repo == "gnonative" || repo == "gnokey-mobile" ? "gnolang" : (repo == "dsocial" ? "gnoverse" : "berty"))) + 
            "/" + repo + (isPullRequest ? "/pull/" : "/issues/") + issue.number;

        const user = issue.user.login;
        const createdAt = new Date(issue.created_at);
        const updatedAt = new Date(issue.updated_at);
        let daysSinceUpdate = (now - updatedAt) / (1000 * 3600 * 24);
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

        let category = "    ";
        if (isPullRequest)
            category = "pull";
        else if (isBug)
            category = isVerified ? "vbug" : "bug ";
        else if (isFeatureRequest)
            category = isApproved ? "appf" : "feat";
        else if (isQuestion)
            category = "ques";

        if (category == "    " && (hasLabel(issue, "Feature") ||
                                   hasLabel(issue, "chore") ||
                                   hasLabel(issue, "🔬 R&D Study") ||
                                   hasLabel(issue, "Toolkit")))
          // Don't show GitHub Project tracking issues.
          continue;

        ++total;

        if (!showedHeader) {
            console.log("\n" + header + ": " + repo);
            showedHeader = true;
        }

        if (createdAt < oldest)
            oldest = createdAt;

        // Wait until 21 days pass for a response.
        const daysRemaining = (isMoreInfoNeeded ? String(Math.max(0, Math.ceil(21 - daysSinceUpdate))).padStart(2, '0') + "d " : "")
        console.log(daysRemaining + category + " " + url + " ".repeat(4 - ("" + issue.number).length) +
                    (isPullRequest ? "   " : " ") + createdAt.toISOString().substring(0, 10) + ", " +
                    String(Math.ceil(daysSinceUpdate)).padStart(2, '0') + "d idle, " +
                    issue.comments + " cmts, " + user + ", " + issue.title);
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
        if (category == "    ")
            console.log("  WARNING: issue/PR #" + issue.number + " doesn't have a label for 'bug', 'question', etc.");
    }

    return { total: total, oldest: oldest}
}

function showGnoPRs() {
    const repo = "gno";
    console.log("\n" + repo);

    const issues = readJsonFile(repo + ".issues.json");
    const pulls = readJsonFile(repo + ".pulls.json");

    let total = 0;
    let now = new Date();
    let oldest = now;
    let fetchMessages = "";
    for (const issue of issues) {
        const isReviewTriagePending = hasLabel(issue, "review/triage-pending");
        const isStale = hasLabel(issue, "Stale");

        const isPullRequest = (issue.pull_request !== undefined);
        if (!isPullRequest)
            continue;
        const url = "https://github.com/" + "gnolang" + "/" + repo + (isPullRequest ? "/pull/" : "/issues/") + issue.number;

        const user = issue.user.login;
        const createdAt = new Date(issue.created_at);
        const updatedAt = new Date(issue.updated_at);
        let daysSinceUpdate = (now - updatedAt) / (1000 * 3600 * 24);
        const message = url + " ".repeat(4 - ("" + issue.number).length) +
            (isPullRequest ? "  " : " ") + createdAt.toISOString().substring(0, 10) + ", " +
            (isStale ? "STALE " : "") + String(Math.ceil(daysSinceUpdate)).padStart(2, '0') + "d idle, " +
            issue.comments + " cmts, " + user + ", " + issue.title;

        let isDraft = false;
        if (isPullRequest) {
            const pull = getPull(pulls, issue.number);
            if (pull == null) {
                // (We don't expect this.)
                console.log(message + "\n  WARNING: Can't find pull request detail: " + url);
                continue;
            }
            else {
                isDraft = pull.draft;
                if (pull.base.ref != "master")
                    continue;
            }
        }

        if (isDraft) {
            if (isReviewTriagePending)
                console.log(message + "\n  WARNING: #" + issue.number + " is draft but has the 'review/triage-pending' label");
            continue;
        }
        if (coreDevs.includes(user)) {
            if (isReviewTriagePending)
                console.log(message + "\n  WARNING: #" + issue.number + " was created by a core dev but has the 'review/triage-pending' label");
            continue;
        }

        let hasGnoDevPullComment = false;
        {
            const comments = readJsonFile(repo + ".pull-comments/" + issue.number + ".json");
            for (const comment of comments) {
                if (coreDevs.includes(comment.user.login)) {
                    hasGnoDevPullComment = true;
                    break;
                }
            }
        }
        let hasGnoDevPullReview = false;
        {
            const comments = readJsonFile(repo + ".pull-reviews/" + issue.number + ".json");
            for (const comment of comments) {
                if (coreDevs.includes(comment.user.login)) {
                    hasGnoDevPullReview = true;
                    break;
                }
            }
        }
        let hasTriageReviewerApproval = false;
        {
            const comments = readJsonFile(repo + ".pull-reviews/" + issue.number + ".json");
            for (const comment of comments) {
                if (comment.state == "APPROVED" && triageReviewers.includes(comment.user.login)) {
                    hasTriageReviewerApproval = true;
                    break;
                }
            }
        }

        if (hasTriageReviewerApproval) {
            if (isReviewTriagePending)
                console.log(message + "\n  WARNING: #" + issue.number + " was approved by a triage reviewer but has the 'review/triage-pending' label");
            continue;
        }
        else if (hasGnoDevPullComment || hasGnoDevPullReview) {
            if (isReviewTriagePending)
                console.log(message + "\n  WARNING: #" + issue.number + " was " + (hasGnoDevPullReview ? "reviewed" : "commented") + " by a core dev but has the 'review/triage-pending' label");
            continue;
        }
        else {
            if (!isReviewTriagePending) {
                // Need to know if a new review is an approval or new comment is from a core dev.
                fetchMessages += '\ncurl "https://api.github.com/repos/gnolang/' + repo + '/pulls/' + issue.number + '/comments" > ' + repo + '.pull-comments/' + issue.number + '.json';
                fetchMessages += '\ncurl "https://api.github.com/repos/gnolang/' + repo + '/pulls/' + issue.number + '/reviews" > ' + repo + '.pull-reviews/' + issue.number + '.json';
            }
        }

        ++total;

        if (createdAt < oldest)
            oldest = createdAt;

        console.log(message);

        if (!isReviewTriagePending)
            console.log("  WARNING: #" + issue.number + " doesn't have the 'review/triage-pending' label");
    }

    console.log(fetchMessages);

    return { total: total, oldest: oldest}
}

function readJsonFile(filePath) {
    let text = "";
    try {
        text = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
        return [];
    }
    const blankResult = "[\n\n]\n";
    if (text.endsWith(blankResult))
        // The second fetched "page" of issues is blank.
        text = text.substring(0, text.length - blankResult.length);
    // Replace the boundary between two pages of results.
    text = text.replaceAll('\n]\n[\n', ',\n');
    if (text == "")
        text = "[]";
    return JSON.parse(text);
}

function getPull(pulls, number) {
    for (const pull of pulls) {
        if (pull.number == number)
            return pull;
    }

    return null;
}

function hasLabel(issue, labelName) {
  for (const label of issue.labels) {
      if (label.name == labelName)
          return true;
  }

  return false;
}

main();
