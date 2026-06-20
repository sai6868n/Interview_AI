from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import os

# ── GitHub credentials — read from environment, never hardcode ──
# Set these in Railway: Service -> Variables -> New Variable
#   GITHUB_CLIENT_ID     = your client id
#   GITHUB_CLIENT_SECRET = your rotated client secret
GITHUB_CLIENT_ID     = os.environ.get("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET", "")

app = FastAPI(title="InterviewAI GitHub Auth")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://interview-ai-nu-virid.vercel.app",
        "https://interview-ai-sai.netlify.app",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/auth/github/callback")
async def github_callback(code: str):
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured on server")

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

    user_resp = requests.get("https://api.github.com/user", headers=auth_headers, timeout=10)
    if user_resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to fetch GitHub user profile")

    user = user_resp.json()
    email = user.get("email")

    if not email:
        emails_resp = requests.get("https://api.github.com/user/emails", headers=auth_headers, timeout=10)
        if emails_resp.status_code == 200:
            emails = emails_resp.json()
            primary = next((e["email"] for e in emails if e.get("primary") and e.get("verified")), None)
            verified = next((e["email"] for e in emails if e.get("verified")), None)
            email = primary or verified or (emails[0]["email"] if emails else None)

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Could not retrieve email from GitHub. Make sure your GitHub account has a verified email."
        )

    return {
        "id":         str(user.get("id", "")),
        "login":      user.get("login", ""),
        "name":       user.get("name") or user.get("login", ""),
        "email":      email,
        "avatar_url": user.get("avatar_url", ""),
        "bio":        user.get("bio", ""),
        "location":   user.get("location", ""),
    }


@app.get("/health")
async def health():
    return {"status": "ok", "service": "InterviewAI GitHub Auth"}


# ── Run standalone ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("github_auth:app", host="127.0.0.1", port=8000, reload=True)