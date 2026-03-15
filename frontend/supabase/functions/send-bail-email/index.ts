// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

type BailPayload = {
  id: string;
  date_entree?: string | null;
  date_sortie?: string | null;
  bail_pdf_url: string;
};

type LocatairePayload = {
  id?: string;
  email: string;
  nom?: string | null;
  prenoms?: string | null;
};

type BienPayload = {
  id?: string;
  titre?: string | null;
  adresse?: string | null;
};

type RequestPayload = {
  bail: BailPayload;
  locataire: LocatairePayload;
  bien?: BienPayload | null;
};

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const env = {
  resendApiKey: Deno.env.get('RESEND_API_KEY') ?? '',
  mailFrom: Deno.env.get('BAIL_MAIL_FROM') ?? 'noreply@location-app.local',
  mailReplyTo: Deno.env.get('BAIL_MAIL_REPLY_TO') ?? '',
  webhookSecret: Deno.env.get('BAIL_EMAIL_FUNCTION_SECRET') ?? '',
  supabaseUrl: Deno.env.get('SUPABASE_URL') ?? '',
  serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
};

const jsonResponse = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const isHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_error) {
    return false;
  }
};

const buildRecipientName = (locataire: LocatairePayload) => {
  const fullName = [locataire.prenoms, locataire.nom].filter(Boolean).join(' ').trim();
  return fullName || 'Locataire';
};

const patchBailStatus = async (bailId: string, status: 'SENT' | 'FAILED', error?: string) => {
  if (!env.supabaseUrl || !env.serviceRoleKey) {
    return;
  }

  const body = status === 'SENT'
    ? { bail_email_status: 'SENT', bail_email_sent_at: new Date().toISOString(), bail_email_error: null }
    : { bail_email_status: 'FAILED', bail_email_error: error?.slice(0, 500) ?? 'Erreur inconnue' };

  await fetch(`${env.supabaseUrl}/rest/v1/premium_baux?id=eq.${encodeURIComponent(bailId)}`, {
    method: 'PATCH',
    headers: {
      apikey: env.serviceRoleKey,
      Authorization: `Bearer ${env.serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
};

serve(async (request: Request) => {
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  if (env.webhookSecret) {
    const receivedSecret = request.headers.get('x-bail-secret') ?? '';
    if (receivedSecret !== env.webhookSecret) {
      return jsonResponse(401, { error: 'Unauthorized request' });
    }
  }

  if (!env.resendApiKey) {
    return jsonResponse(500, { error: 'Missing RESEND_API_KEY' });
  }

  let payload: RequestPayload;
  try {
    payload = (await request.json()) as RequestPayload;
  } catch (_error) {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const bail = payload?.bail;
  const locataire = payload?.locataire;
  const bien = payload?.bien;

  if (!bail?.id) {
    return jsonResponse(400, { error: 'Missing bail.id' });
  }

  if (!bail?.bail_pdf_url || !isHttpUrl(bail.bail_pdf_url)) {
    return jsonResponse(400, { error: 'Missing or invalid bail.bail_pdf_url' });
  }

  if (!locataire?.email) {
    await patchBailStatus(bail.id, 'FAILED', 'Email locataire manquant');
    return jsonResponse(400, { error: 'Missing locataire.email' });
  }

  const recipientName = buildRecipientName(locataire);
  const bienTitle = bien?.titre?.trim() || 'votre location';
  const bailStartDate = bail?.date_entree ? new Date(bail.date_entree).toLocaleDateString('fr-FR') : 'N/A';

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.5;max-width:640px;margin:0 auto;">
      <h2 style="margin-bottom:12px;">Votre bail est disponible</h2>
      <p>Bonjour ${recipientName},</p>
      <p>
        Votre bail pour <strong>${bienTitle}</strong> (date d'effet: <strong>${bailStartDate}</strong>)
        a ete genere. Vous pouvez le consulter et le telecharger via le lien ci-dessous.
      </p>
      <p>
        <a href="${bail.bail_pdf_url}" style="display:inline-block;background:#0f766e;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;">
          Ouvrir mon bail
        </a>
      </p>
      <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur:</p>
      <p><a href="${bail.bail_pdf_url}">${bail.bail_pdf_url}</a></p>
      <p style="margin-top:24px;color:#6b7280;">Cet email est envoye automatiquement, merci de ne pas y repondre directement.</p>
    </div>
  `;

  const resendPayload: Record<string, unknown> = {
    from: env.mailFrom,
    to: [locataire.email],
    subject: 'Votre bail numerique est pret',
    html,
  };

  if (env.mailReplyTo) {
    resendPayload.reply_to = env.mailReplyTo;
  }

  try {
    const resendResponse = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    });

    const responseText = await resendResponse.text();

    if (!resendResponse.ok) {
      await patchBailStatus(bail.id, 'FAILED', responseText || 'Echec envoi fournisseur email');
      return jsonResponse(502, {
        error: 'Email provider error',
        provider_status: resendResponse.status,
        details: responseText,
      });
    }

    await patchBailStatus(bail.id, 'SENT');

    let providerResponse: Record<string, unknown> | string = {};
    if (responseText) {
      try {
        providerResponse = JSON.parse(responseText);
      } catch (_error) {
        providerResponse = responseText;
      }
    }

    return jsonResponse(200, {
      status: 'sent',
      bail_id: bail.id,
      provider_response: providerResponse,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    await patchBailStatus(bail.id, 'FAILED', message);
    return jsonResponse(500, { error: message });
  }
});
