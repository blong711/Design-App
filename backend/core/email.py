import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import settings
import logging

logger = logging.getLogger(__name__)

async def send_verification_email(email: str, token: str, full_name: str):
    """Send email verification link to user"""
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
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg['To'] = email
        
        # Attach both plain text and HTML versions
        part1 = MIMEText(text_body, 'plain')
        part2 = MIMEText(html_body, 'html')
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            
            logger.info(f"Verification email sent to {email}")
            return True
        else:
            logger.warning(f"SMTP not configured. Verification link would be: {verification_url}")
            # In development, just log the URL
            print(f"\n{'='*80}")
            print(f"📧 EMAIL VERIFICATION LINK FOR {email}:")
            print(f"   {verification_url}")
            print(f"{'='*80}\n")
            return True
    except Exception as e:
        logger.error(f"Failed to send verification email to {email}: {str(e)}")
        print(f"\n⚠️  Failed to send email, but here's the verification link:")
        print(f"   {verification_url}\n")
        # Don't fail registration if email fails
        return True
