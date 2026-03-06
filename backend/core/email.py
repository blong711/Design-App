import base64
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request

from core.config import settings

logger = logging.getLogger(__name__)

def get_gmail_service():
    """Get authorized Gmail API service."""
    creds = Credentials(
        None,
        refresh_token=settings.GOOGLE_REFRESH_TOKEN,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
    )
    
    # Refresh token if expired
    if creds.expired:
        creds.refresh(Request())
        
    return build('gmail', 'v1', credentials=creds)

async def send_verification_email(email: str, token: str, full_name: str):
    """Send email verification link to user using Gmail API"""
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    
    subject = "Verify your email - Design Manager"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(90deg, #ec4899, #a855f7); padding: 30px; text-align: center; color: white; }}
            .content {{ background: #f9f9f9; padding: 30px; }}
            .button {{ display: inline-block; padding: 12px 30px; background: linear-gradient(90deg, #ec4899, #a855f7); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to Design Manager!</h1>
            </div>
            <div class="content">
                <h2>Hi {full_name},</h2>
                <p>Thank you for registering with Design Manager. To complete your registration, please verify your email address by clicking the button below:</p>
                <div style="text-align: center;">
                    <a href="{verification_url}" class="button">Verify Email Address</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">{verification_url}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>© 2026 Design Manager. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_body = f"""
    Hi {full_name},
    
    Thank you for registering with Design Manager. To complete your registration, please verify your email address by clicking the link below:
    
    {verification_url}
    
    This link will expire in 24 hours.
    
    If you didn't create an account, please ignore this email.
    
    © 2026 Design Manager. All rights reserved.
    """
    
    try:
        if not all([settings.GOOGLE_CLIENT_ID, settings.GOOGLE_CLIENT_SECRET, settings.GOOGLE_REFRESH_TOKEN]):
            logger.warning(f"Google API not configured. Verification link: {verification_url}")
            print(f"\n📧 EMAIL VERIFICATION LINK FOR {email}: {verification_url}\n")
            return True

        service = get_gmail_service()
        
        message = MIMEMultipart('alternative')
        message['to'] = email
        message['subject'] = subject
        
        part1 = MIMEText(text_body, 'plain')
        part2 = MIMEText(html_body, 'html')
        message.attach(part1)
        message.attach(part2)

        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        
        service.users().messages().send(
            userId='me',
            body={'raw': raw_message}
        ).execute()

        logger.info(f"Verification email sent to {email} via Gmail API")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send verification email to {email}: {str(e)}")
        print(f"\n⚠️ Fallback link: {verification_url}\n")
        return True
