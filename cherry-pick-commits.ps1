# Cherry-pick commits from old branch to new branch based on stage

# Configuration
$oldBranch = "claude/dialogue-system-tool-01RJXWCXckW3izeJymLqGcy4"
$newBranch = "claude/dialogue-system-tool-rebased"

Write-Host "Step 1: Fetching latest from origin..." -ForegroundColor Cyan
git fetch origin

Write-Host "`nStep 2: Checking if branch '$newBranch' already exists..." -ForegroundColor Cyan
$branchExists = git branch --list $newBranch
$remoteBranchExists = git branch -r --list "origin/$newBranch"

if ($branchExists -or $remoteBranchExists) {
    Write-Host "Branch '$newBranch' already exists. Deleting it first..." -ForegroundColor Yellow
    
    # Check if we're currently on that branch
    $currentBranch = git rev-parse --abbrev-ref HEAD
    if ($currentBranch -eq $newBranch) {
        Write-Host "Currently on '$newBranch'. Switching to a different branch first..." -ForegroundColor Yellow
        git checkout origin/stage 2>$null
        if ($LASTEXITCODE -ne 0) {
            git checkout main 2>$null
            if ($LASTEXITCODE -ne 0) {
                git checkout stage 2>$null
            }
        }
    }
    
    # Delete local branch
    if ($branchExists) {
        git branch -D $newBranch
    }
}

Write-Host "Creating new branch '$newBranch' from origin/stage..." -ForegroundColor Cyan
git checkout origin/stage -b $newBranch

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to create branch." -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 3: Getting list of commits to cherry-pick..." -ForegroundColor Cyan
$commits = git log origin/stage..$oldBranch --oneline --reverse

if ($commits.Count -eq 0) {
    Write-Host "No commits to cherry-pick. Branches may be in sync." -ForegroundColor Yellow
    exit 0
}

Write-Host "`nFound $($commits.Count) commit(s) to cherry-pick:" -ForegroundColor Green
$commits | ForEach-Object { Write-Host "  $_" }

Write-Host "`nStep 4: Starting cherry-pick..." -ForegroundColor Cyan
git cherry-pick origin/stage..$oldBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccess! All commits cherry-picked successfully." -ForegroundColor Green
    Write-Host "`nCurrent branch: $newBranch" -ForegroundColor Cyan
    Write-Host "You can now push this branch or continue working on it." -ForegroundColor Cyan
} else {
    Write-Host "`nCherry-pick encountered conflicts or errors." -ForegroundColor Yellow
    Write-Host "Resolve conflicts, then run: git cherry-pick --continue" -ForegroundColor Yellow
    Write-Host "Or abort with: git cherry-pick --abort" -ForegroundColor Yellow
}

