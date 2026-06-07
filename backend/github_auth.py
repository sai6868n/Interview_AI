# ═══════════════════════════════════════════════════════════════
#  INTERVIEWAI — github_auth.py
#  GitHub OAuth token exchange endpoint
#  ---------------------------------------------------------------
#  ADD THIS TO YOUR EXISTING backend or run standalone.
#
#  INSTALL DEPS (if not already):
#    pip install fastapi uvicorn requests
#
#  RUN STANDALONE:
#    uvicorn github_auth:app --host 127.0.0.1 --port 8000 --reload
#
#  OR paste the router into your existing speech.py / main.py
# ═══════════════════════════════════════════════════════════════

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests

# ── ⚙️  YOUR GITHUB CREDENTIALS ────────────────────────────────
GITHUB_CLIENT_ID     = "0v23liiwJZY46AHaELJe"
GITHUB_CLIENT_SECRET = "d53bd141b223d0266b3c8935c4fba02aaa727334"
# ───────────────────────────────────────────────────────────────

app = FastAPI(title="InterviewAI GitHub Auth")

# ── CORS: allow your frontend origin ──────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost",
        "http://127.0.0.1",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/auth/github/callback")
async def github_callback(code: str):
    """
    Called by auth.js after GitHub redirects back with ?code=xxx
    1. Exchange code → access token
    2. Fetch GitHub user profile + primary email
    3. Return { id, login, name, email, avatar_url } to frontend
    """

    # ── Step 1: Exchange code for access token ─────────────────
    token_resp = requests.post(
        "https://github.com/login/oauth/access_token",
        headers={"Accept": "application/json"},
        data={
            "client_id":     GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code":          code,
        },
        timeout=10,
    )

    if token_resp.status_code != 200:
        raise HTTPException(status_code=502, detail="GitHub token exchange failed")

    token_data = token_resp.json()

    if "error" in token_data:
        raise HTTPException(
            status_code=400,
            detail=f"GitHub error: {token_data.get('error_description', token_data['error'])}"
        )

    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=502, detail="No access token returned by GitHub")

    auth_headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }

    # ── Step 2a: Fetch user profile ────────────────────────────
    user_resp = requests.get(
        "https://api.github.com/user",
        headers=auth_headers,
        timeout=10,
    )

    if user_resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to fetch GitHub user profile")

    user = user_resp.json()

    # ── Step 2b: Fetch primary verified email ──────────────────
    # (public profile email may be null; emails endpoint is more reliable)
    email = user.get("email")  # may be None

    if not email:
        emails_resp = requests.get(
            "https://api.github.com/user/emails",
            headers=auth_headers,
            timeout=10,
        )
        if emails_resp.status_code == 200:
            emails = emails_resp.json()
            # Pick primary + verified email first, fallback to any verified
            primary = next(
                (e["email"] for e in emails if e.get("primary") and e.get("verified")),
                None,
            )
            verified = next(
                (e["email"] for e in emails if e.get("verified")),
                None,
            )
            email = primary or verified or (emails[0]["email"] if emails else None)

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Could not retrieve email from GitHub. Make sure your GitHub account has a verified email."
        )

    # ── Step 3: Return clean user object to frontend ───────────
    return {
        "id":         str(user.get("id", "")),
        "login":      user.get("login", ""),
        "name":       user.get("name") or user.get("login", ""),
        "email":      email,
        "avatar_url": user.get("avatar_url", ""),
        "bio":        user.get("bio", ""),
        "location":   user.get("location", ""),
    }


# ── Health check ───────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "InterviewAI GitHub Auth"}


# ── Run standalone ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("github_auth:app", host="127.0.0.1", port=8000, reload=True)