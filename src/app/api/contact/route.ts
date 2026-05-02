// app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Preencha todos os campos." },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    await resend.emails.send({
      from: "The Order Flow <noreply@The Order Flow.com.br>", // domínio verificado no Resend
      to: process.env.CONTACT_EMAIL!, // seu e-mail no .env
      replyTo: email,
      subject: `[The Order Flow] Nova mensagem de ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: auto; padding: 32px; background: #0f0f14; border: 1px solid #1e1e2e; border-radius: 16px; color: #e2e2e8;">
          <h2 style="color: #a78bfa; margin: 0 0 24px;">Nova mensagem via formulário</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; width: 80px;">Nome</td>
              <td style="padding: 8px 0; font-weight: 600;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">E-mail</td>
              <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #a78bfa;">${email}</a></td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #1e1e2e; margin: 20px 0;" />
          <p style="white-space: pre-wrap; line-height: 1.7; color: #c4c4d4;">${message}</p>
          <p style="margin-top: 32px; font-size: 11px; color: #555;">Enviado via The Order Flow — The Order Flow-coral.vercel.app</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact/route]", err);
    return NextResponse.json(
      { error: "Erro ao enviar mensagem. Tente novamente." },
      { status: 500 },
    );
  }
}
