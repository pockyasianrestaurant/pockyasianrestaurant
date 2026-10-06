# Pocky website editor

The editor is live at [pockyasianrestaurant.com.au/admin](https://pockyasianrestaurant.com.au/admin). It works on phones and computers. Your account needs to be invited by the website designer.

## Add a banner and popup

1. Sign in and choose **Announcements**.
2. Choose **+ Add announcement**.
3. Enter a short title for the banner, and the longer message for the popup.
4. Add a button label and an HTTPS booking link if needed. Pocky’s booking portal is https://bookings.obeeapp.com/pockyasianrestaurant.
5. Switch **Enabled** on. Add start and end times if you want it scheduled. All times use Queensland time (AEST).
6. Choose **Preview changes**, then **Publish changes**.

The popup appears once per browser visit. Guests can reopen it using the top banner. Changes to the announcement allow the updated popup to appear again. The popup can be closed with its close button or Escape. Scheduled announcements stop appearing at the end time.

## Replace a PDF menu

Choose **PDF menus**, select the main or kids menu, upload a PDF smaller than 4 MB, then publish. Uploading alone does not replace the live menu.

## Update hours or copy

Choose **Opening hours** or **Website copy**, edit the fields, then publish. Opening hours update both the footer and ordering information. Colours, fonts, graphics and page layout remain under your designer’s control.

## Before leaving

Publish your changes before leaving the page. The editor warns if you have unpublished changes. If another editor has published first, reload before making further changes so their work is not overwritten.

## Designer setup and maintenance

The implementation uses Netlify Identity 2.0 and Netlify Blobs. It does not grant clients GitHub repository or Netlify dashboard access.

- Enable Netlify Identity, set registration to **Invite only**, and invite the approved email addresses.
- Assign each editor the **content-editor** role in Identity. The server reads current roles before accepting writes.
- The client must choose their own password through the invitation link. Identity invitation and recovery links arriving at the homepage redirect to /admin.
- Build command: npm run build. Publish folder: dist. Function source: cms-functions.
- Content and uploaded PDFs live in the site-wide **pocky-content-v1** Blobs store and persist across website deployments. Previous published content is stored under private history keys. Use the Netlify Blobs tools for designer-led recovery.
- PDFs are public website downloads. Upload only menus intended for publication.
- The API allows public reading of published content. Authenticated writes require the content-editor role, a same-origin request, validated fixed content fields, and the current content revision.
- Deploy previews use a separate **pocky-preview-v1** content store, so preview edits cannot change the production website.
- Changes appear on newly loaded pages. Already open pages refresh announcement schedules every 30 seconds using the content loaded at page opening.
- Netlify hosting usage applies to function calls and storage. No separate CMS subscription is added; check existing plan allowances before client handover.

## Verification completed

Production build completed locally. Eight automated checks cover schema limits, unsafe links, AEST schedule boundaries, valid menu paths, public defaults, editor authorization and origin checks, conflicting edits, and PDF validation. Browser checks cover local preview publication, banner and popup rendering, popup dismissal, and a 390 px mobile editor layout. The live editor, content API and PDF links passed deployment checks. Unauthenticated and cross-origin writes were rejected. Invite-only Identity is active, and nicholasgoodridge@hotmail.com has been invited with the content-editor role. The designer has confirmed successful real announcement publishing and PDF menu uploads.

## Designer change log

Sign into your existing designer account and choose **Change log**. You can inspect who published each revision, when, and the before/after values; view PDF upload records; load older publications; and download the loaded history as JSON. Only the designer Identity account configured in the website code can read this log, and it must still have the content-editor role. New editors cannot access or delete history. Keep exported logs private.

Audit recording starts with this update. Earlier changes cannot be attributed retrospectively. Published revisions preserve full before/after snapshots for designer-led recovery. The log identifies the account used, not proof of the person operating it; it does not detect every unsuccessful login or attempted attack. Changes made directly through Netlify/GitHub outside the CMS are outside this log.
