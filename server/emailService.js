import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configurar transporter SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    family: 4 // Force IPv4 to prevent 60s timeout issues
  });
};



// Função para enviar email
export const sendEmail = async ({ to, subject, text, observations, type = 'invite', senderName, senderEmail, sosData, reportData, healthLogsData, healthLogsByPatient, attachments, phone }) => {
  try {
    // Validar dados obrigatórios
    if (!to || !subject || !text) {
      throw new Error('Campos obrigatórios: to, subject, text');
    }

    // Validar configuração SMTP
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('Configurações SMTP não encontradas. Configure o arquivo .env');
    }

    const transporter = createTransporter();

    // Selecionar Template
    const getTemplate = (type, data) => {
      const year = new Date().getFullYear();

      const styles = `
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; } 
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 40px 32px; color: #334155; line-height: 1.6; font-size: 16px; }
        .welcome-text { margin-bottom: 24px; font-size: 18px; color: #1e293b; font-weight: 600; }
        .message-box { background-color: #f8fafc; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0; color: #475569; }
        .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 4px; display: block; }
        .value { color: #1e293b; font-weight: 500; }
        .cta-container { text-align: center; margin-top: 32px; margin-bottom: 16px; }
        .button { display: inline-block; background-color: #10b981; color: #ffffff !important; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; transition: background-color 0.2s; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2); }
        .button:hover { background-color: #059669; }
        .footer { background-color: #f8fafc; padding: 24px; text-align: center; color: #94a3b8; font-size: 13px; border-top: 1px solid #e2e8f0; }
        .alert-row { display: flex; gap: 10px; margin-bottom: 15px; } 
        .alert-item { flex: 1; background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px; text-align: center; }
        .alert-title { color: #b91c1c; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .alert-val { color: #991b1b; font-size: 16px; font-weight: 800; margin-top: 4px; }
      `;

      const baseHtml = (content) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${styles}</style>
        </head>
        <body>
          <div class="container">
            ${content}
            <div class="footer">
              <p>Este é um email automático do SiG Remédios.</p>
              <p>© ${year} SiG Remédios. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      if (type === 'sos') {
        const { sosData } = data;
        return baseHtml(`
          <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);">
             <div style="background: rgba(255,255,255,0.2); width: 64px; height: 64px; border-radius: 50%; display: block; text-align: center; line-height: 64px; margin: 0 auto 15px auto; font-size: 32px; color: transparent; text-shadow: 0 0 0 #ffffff;">🚨</div>
             <h1>SOS | Ficha de Emergência</h1>
             <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0; font-weight: 500;">${sosData.patientName}</p>
             ${(sosData.patientEmail || sosData.patientPhone) ? `
                <div style="margin-top: 10px; font-size: 14px; color: rgba(255,255,255,0.9);">
                    ${sosData.patientPhone ? `<a href="tel:${sosData.patientPhone}" style="color: #ffffff; text-decoration: none; font-weight: 600;">📞 ${sosData.patientPhone}</a>` : ''}
                    ${sosData.patientPhone && sosData.patientEmail ? ' <span style="opacity: 0.5">|</span> ' : ''}
                    ${sosData.patientEmail ? `<a href="mailto:${sosData.patientEmail}" style="color: #ffffff; text-decoration: none; font-weight: 600;">✉️ ${sosData.patientEmail}</a>` : ''}
                </div>
             ` : ''}
          </div>
          <div class="content">
            <div class="welcome-text" style="color: #b91c1c;">Informações Médicas Críticas</div>
            <p>Este documento contém informações vitais de saúde compartilhadas via aplicativo SiG Remédios.</p>
            
            <div class="alert-row">
                ${sosData.bloodType ? `
                <div class="alert-item">
                    <div class="alert-title">Tipo Sanguíneo</div>
                    <div class="alert-val">${sosData.bloodType}</div>
                </div>` : ''}
                ${sosData.allergies ? `
                <div class="alert-item" style="background: #fef3c7; border-color: #fde68a;">
                    <div class="alert-title" style="color: #b45309;">Alergias</div>
                    <div class="alert-val" style="color: #92400e; font-size: 14px;">${sosData.allergies}</div>
                </div>` : ''}
            </div>

            ${sosData.conditions ? `
            <div class="message-box" style="border-left-color: #3b82f6; background-color: #eff6ff;">
               <span class="label" style="color: #1e40af;">Condição Principal</span>
               <div class="value" style="color: #1e3a8a;">${sosData.conditions}</div>
            </div>` : ''}

            ${sosData.locationUrl ? `
            <div style="margin-top: 20px; text-align: center; background: #fff1f2; border: 2px solid #fecaca; padding: 20px; border-radius: 12px;">
                <div class="label" style="color: #b91c1c; margin-bottom: 10px;">📍 Localização do Paciente</div>
                <a href="${sosData.locationUrl}" target="_blank" style="display: inline-block; background-color: #ef4444; color: #ffffff !important; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2);">Ver no Google Maps</a>
                ${sosData.address ? `
                <div style="margin-top: 15px; font-size: 14px; color: #1e293b; background: white; padding: 10px; border-radius: 8px; border: 1px solid #fee2e2;">
                    <strong>Endereço Estimado:</strong><br/>
                    ${sosData.address}
                </div>` : ''}
                ${sosData.locationAccuracy > 300 ? `
                <div style="margin-top: 10px; font-size: 11px; color: #991b1b; font-style: italic;">
                    ⚠️ Nota: Precisão estimada de ${Math.round(sosData.locationAccuracy)}m. Pode haver divergência se o paciente estiver em ambiente fechado ou usando rede móvel em Desktop.
                </div>` : ''}
            </div>` : `
            <div style="margin-top: 20px; text-align: center; background: #f8fafc; border: 1px dashed #cbd5e1; padding: 15px; border-radius: 12px; color: #64748b; font-size: 14px;">
                📍 Localização não disponibilizada pelo dispositivo.
            </div>`}

            <div style="margin-top: 30px;">
                <h3 style="font-size: 16px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">💊 Medicamentos em Uso</h3>
                <div style="background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; color: #334155; line-height: 1.8;">
                    ${sosData.medications || 'Nenhum medicamento registrado.'}
                </div>
            </div>

            <div style="margin-top: 30px;">
                <h3 style="font-size: 16px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">📞 Contatos de Emergência</h3>
                ${sosData.contacts && sosData.contacts.length > 0 ? sosData.contacts.map(contact => {
          const cleanPhone = String(contact.phone || '').replace(/\D/g, '');
          const formattedPhone = cleanPhone.length === 11
            ? `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`
            : cleanPhone.length === 10
              ? `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`
              : contact.phone;

          const whatsappUrl = cleanPhone.length >= 10
            ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(`🚨 *ALERTA SOS - SiG Remédios*\n\nEste é um contato de emergência referente a *${sosData.patientName}*.\n\nLocalização: ${sosData.locationUrl || 'Não informada'}`)}`
            : null;

          return `
                    <div style="background: #1e293b; color: white; padding: 20px; border-radius: 12px; margin-bottom: 10px;">
                        <span class="label" style="color: #94a3b8;">${contact.name}</span>
                        <div style="font-size: 18px; font-weight: 700; margin-top: 5px;">
                             <a href="tel:${cleanPhone}" style="color: #ffffff; text-decoration: none;">📞 ${formattedPhone}</a>
                        </div>
                        ${whatsappUrl ? `
                        <div style="margin-top: 10px;">
                            <a href="${whatsappUrl}" target="_blank" style="display: inline-block; background-color: #25d366; color: #ffffff !important; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; border: 1px solid #128c7e;">
                                <span style="font-size: 16px;">💬</span> Conversar no WhatsApp
                            </a>
                        </div>` : ''}
                    </div>
                    `;
        }).join('') : `
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; text-align: center; color: #64748b;">
                        Nenhum contato cadastrado.
                    </div>
                `}
            </div>

            <div class="cta-container">
              <a href="${frontendUrl}" class="button" style="background-color: #dc2626;">Acessar Ficha Completa</a>
            </div>
          </div>
        `);
      }

      if (type === 'report') {
        const { reportData } = data;
        // Fallback for stats if missing
        const stats = reportData.summary || { total: 0, taken: 0, pending: 0, adherenceRate: 0 };

        return baseHtml(`
          <div class="header" style="background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);">
             <div style="background: rgba(255,255,255,0.2); width: 64px; height: 64px; border-radius: 50%; display: block; text-align: center; line-height: 64px; margin: 0 auto 15px auto; font-size: 32px; color: transparent; text-shadow: 0 0 0 #ffffff;">📊</div>
             <h1>Relatório de Saúde</h1>
             <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0; font-weight: 500;">Período: ${reportData.startDate} a ${reportData.endDate}</p>
             <div style="margin-top: 10px; font-size: 14px; color: rgba(255,255,255,0.9); background: rgba(0,0,0,0.1); display: inline-block; padding: 4px 12px; border-radius: 20px;">
                ${reportData.patientName}
             </div>
          </div>
          <div class="content">
            <div class="welcome-text" style="color: #0f766e;">Resumo do Tratamento</div>
            <p>Segue em anexo o relatório detalhado em PDF. Abaixo, um resumo dos indicadores de adesão para o período selecionado.</p>
            
            <div style="display: flex; gap: 8px; margin: 25px 0; flex-wrap: wrap;">
                <!-- Card Total -->
                <div style="flex: 1; min-width: 80px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 15px; text-align: center; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.05);">
                    <div style="color: #0284c7; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL</div>
                    <div style="color: #0369a1; font-size: 24px; font-weight: 800; margin-top: 5px;">${stats.total}</div>
                </div>
                
                <!-- Card Taken -->
                <div style="flex: 1; min-width: 80px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 15px; text-align: center; box-shadow: 0 2px 4px rgba(34, 197, 94, 0.05);">
                    <div style="color: #16a34a; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">TOMADAS</div>
                    <div style="color: #15803d; font-size: 24px; font-weight: 800; margin-top: 5px;">${stats.taken}</div>
                </div>

                <!-- Card Pending -->
                <div style="flex: 1; min-width: 80px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 15px; text-align: center; box-shadow: 0 2px 4px rgba(249, 115, 22, 0.05);">
                    <div style="color: #ea580c; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">PENDENTES</div>
                    <div style="color: #c2410c; font-size: 24px; font-weight: 800; margin-top: 5px;">${stats.pending}</div>
                </div>
            </div>

            <!-- Adherence Big Card -->
            <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 25px;">
                <div style="color: #9333ea; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">TAXA DE ADESÃO</div>
                <div style="color: #7e22ce; font-size: 36px; font-weight: 900;">${stats.adherenceRate}%</div>
                <div style="height: 6px; width: 100%; max-width: 200px; background: #e9d5ff; border-radius: 3px; margin: 10px auto 0;">
                    <div style="height: 100%; width: ${stats.adherenceRate}%; background: #a855f7; border-radius: 3px;"></div>
                </div>
            </div>

            ${data.observations ? `
            <div class="message-box" style="border-left-color: #0d9488; background: #f0fdfa;">
                <span class="label" style="color: #0f766e;">Observações</span>
                <div class="value" style="color: #134e4a;">${data.observations}</div>
            </div>` : ''}

            <div class="cta-container">
              <a href="${frontendUrl}" class="button" style="background-color: #0d9488;">Acessar Relatório Completo</a>
            </div>
            
            <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 20px;">
                * O arquivo PDF detalhado encontra-se em anexo.
            </p>
          </div>
        `);
      }

      if (type === 'contact') {
        const { senderName, senderEmail, message: rawMessage } = data;
        // Sanitizar mensagem: remove emojis e caracteres especiais complexos
        const message = String(rawMessage || '').replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');

        return baseHtml(`
          <div class="header" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);">
            <h1>SiG Remédios - Nova Mensagem</h1>
          </div>
          <div class="content">
            <div class="welcome-text">Olá, Admin!</div>
            <p>Você recebeu uma nova mensagem através do portal <strong>SiG Remédios</strong>.</p>
            
            <div class="message-box">
              <span class="label">Remetente</span>
              <div class="value" style="margin-bottom: 12px;">
                <strong>${senderName}</strong> <span style="font-size: 14px; color: #64748b;">(${senderEmail})</span>
                ${data.phone ? `
                <div style="margin-top: 8px;">
                    <a href="https://wa.me/55${data.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Recebemos seu contato pelo *SiG Remédios*.\n\nVocê escreveu:\n_"${message}"_\n\n*Ficamos felizes com seu contato!* Estou por aqui para ajudar. Podemos conversar?\n\n*Acesse:* https://sigremedios.vercel.app`)}" target="_blank" style="display: inline-flex; align-items: center; gap: 5px; color: #166534; background: #dcfce7; padding: 5px 10px; border-radius: 20px; text-decoration: none; font-weight: 600; font-size: 14px; border: 1px solid #bbf7d0;">
                        WhatsApp: ${data.phone}
                    </a>
                </div>
                ` : ''}
              </div>
              
              <span class="label">Mensagem</span>
              <div class="value">${message ? String(message).replace(/\n/g, '<br>') : ''}</div>
            </div>

            <div class="cta-container">
              <a href="${frontendUrl}" class="button">Acessar SiG Remédios</a>
            </div>
          </div>
        `);
      }

      if (type === 'health-diary') {
        return baseHtml(`
          <div class="header" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);">
            <div style="background: rgba(255,255,255,0.2); width: 64px; height: 64px; border-radius: 50%; display: block; text-align: center; line-height: 64px; margin: 0 auto 15px auto; font-size: 32px; color: transparent; text-shadow: 0 0 0 #ffffff;">📋</div>
            <h1>Diário de Saúde</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0; font-weight: 500;">Relatório Completo de Sinais Vitais</p>
          </div>
          <div class="content">
            <div class="welcome-text" style="color: #7c3aed;">Olá!</div>
            <p>Segue em anexo o <strong>Diário de Saúde</strong> completo em formato PDF com todos os registros de sinais vitais.</p>
            
            ${data.observations ? `
            <div class="message-box" style="border-left-color: #8b5cf6; background: #faf5ff;">
              <span class="label" style="color: #7c3aed;">📝 Observações</span>
              <div class="value" style="color: #6b21a8;">${data.observations}</div>
            </div>` : ''}

              
              ${data.healthLogsByPatient && data.healthLogsByPatient.length > 0 ? data.healthLogsByPatient.map((patientGroup, groupIndex) => `
                ${groupIndex > 0 ? '<div style="margin-top: 30px;"></div>' : ''}
                
                <!-- Cabeçalho do Paciente -->
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 16px; margin-bottom: 15px; border-left: 4px solid #8b5cf6;">
                  <div style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
                    👤 ${patientGroup.patientName}
                  </div>
                  <div style="font-size: 13px; color: #64748b;">
                    ${patientGroup.count} registro(s)
                  </div>
                </div>

                <!-- Tabela do Paciente -->
                <div style="overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff; margin-bottom: 20px;">
                  <table style="width: 100%; min-width: 600px; border-collapse: collapse; font-size: 14px;">
                    <thead>
                      <tr style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);">
                        <th style="padding: 12px 16px; text-align: left; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; white-space: nowrap;">Data/Hora</th>
                        <th style="padding: 12px 16px; text-align: left; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; white-space: nowrap;">Categoria</th>
                        <th style="padding: 12px 16px; text-align: center; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; white-space: nowrap;">Valor</th>
                        <th style="padding: 12px 16px; text-align: left; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1;">Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${patientGroup.logs.map((log, index) => `
                      <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 16px; color: #475569; white-space: nowrap;">${log.date}</td>
                        <td style="padding: 12px 16px; color: #1e293b; font-weight: 600;">${log.category}</td>
                        <td style="padding: 12px 16px; text-align: center; color: #7c3aed; font-weight: 700;">${log.value}</td>
                        <td style="padding: 12px 16px; color: #64748b; font-size: 13px;">${log.notes}</td>
                      </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              `).join('') : `
                <div style="overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
                  <table style="width: 100%; min-width: 600px; border-collapse: collapse; font-size: 14px;">
                    <tbody>
                      <tr style="background: #ffffff;">
                        <td colspan="4" style="padding: 20px; text-align: center; color: #94a3b8; font-style: italic;">
                          Nenhum registro encontrado
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              `}

              ${data.healthLogsByPatient && data.healthLogsByPatient.length > 0 ? `
              <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px; margin-top: 20px; text-align: center;">
                <div style="color: #0369a1; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                  📊 Total: ${data.healthLogsByPatient.reduce((sum, p) => sum + p.count, 0)} registro(s)
                </div>
                <div style="color: #0284c7; font-size: 12px;">
                  Consulte o PDF anexo para o histórico completo e detalhado
                </div>
              </div>
              ` : ''}

            </div>

            <div class="cta-container">
              <a href="${frontendUrl}" class="button" style="background-color: #8b5cf6;">Acessar Sistema Completo</a>
            </div>
            
            <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 20px;">
              📎 O arquivo PDF completo com todos os registros encontra-se em anexo.
            </p>
          </div>
        `);
      }

      if (type === 'low_stock') {
        const { lowStockData } = data;
        const threshold = lowStockData?.threshold || 4;

        return baseHtml(`
          <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
             <div style="background: rgba(255,255,255,0.2); width: 64px; height: 64px; border-radius: 50%; display: block; text-align: center; line-height: 64px; margin: 0 auto 15px auto; font-size: 32px; color: transparent; text-shadow: 0 0 0 #ffffff;">⚠️</div>
             <h1>Alerta de Estoque Baixo</h1>
             <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0; font-weight: 500;">${lowStockData?.medicationName}</p>
          </div>
          <div class="content">
            <div class="welcome-text" style="color: #d97706;">Olá, ${lowStockData?.recipientName || 'Usuário'}!</div>
            <p>O estoque do medicamento <strong>${lowStockData?.medicationName}</strong> está baixo e precisa ser reposto em breve.</p>
            
            <!-- Cards de Informação -->
            <div style="display: flex; gap: 10px; margin: 25px 0; flex-wrap: wrap;">
                <!-- Paciente -->
                <div style="flex: 1; min-width: 120px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 15px; text-align: center;">
                    <div style="color: #0284c7; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">PACIENTE</div>
                    <div style="color: #0369a1; font-size: 16px; font-weight: 700; margin-top: 5px;">${lowStockData?.patientName}</div>
                </div>
                
                <!-- Estoque Atual -->
                <div style="flex: 1; min-width: 120px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 15px; text-align: center;">
                    <div style="color: #d97706; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">ESTOQUE ATUAL</div>
                    <div style="color: #92400e; font-size: 20px; font-weight: 800; margin-top: 5px;">${lowStockData?.currentStock} ${lowStockData?.unit || 'unid.'}</div>
                </div>
                
                <!-- Duração -->
                <div style="flex: 1; min-width: 120px; background: #fee2e2; border: 1px solid #fecaca; border-radius: 12px; padding: 15px; text-align: center;">
                    <div style="color: #dc2626; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">DURAÇÃO</div>
                    <div style="color: #991b1b; font-size: 20px; font-weight: 800; margin-top: 5px;">${lowStockData?.daysRemaining} dia${lowStockData?.daysRemaining !== 1 ? 's' : ''}</div>
                </div>
            </div>

            <!-- Informações do Medicamento -->
            <div class="message-box" style="border-left-color: #f59e0b; background: #fffbeb;">
               <span class="label" style="color: #d97706;">💊 INFORMAÇÕES DO MEDICAMENTO</span>
               <div style="margin-top: 10px; color: #78350f;">
                  <div style="margin-bottom: 8px;"><strong>Nome:</strong> ${lowStockData?.medicationName}</div>
                  ${lowStockData?.dosage ? `<div style="margin-bottom: 8px;"><strong>Dosagem:</strong> ${lowStockData.dosage}</div>` : ''}
                  <div style="margin-bottom: 8px;"><strong>Uso diário:</strong> ${lowStockData?.dailyUsage || 'N/A'} ${lowStockData?.unit || 'unidades'}/dia</div>
                  <div><strong>Quantidade sugerida:</strong> ${lowStockData?.suggestedQuantity || 'N/A'} ${lowStockData?.unit || 'unidades'} (30 dias)</div>
               </div>
            </div>

            <!-- Alert Box -->
            <div style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border: 2px solid #fed7aa; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
                <div style="color: #ea580c; font-size: 14px; font-weight: 700; margin-bottom: 10px;">
                    ⏰ ATENÇÃO: Estoque acaba em ${lowStockData?.daysRemaining} dia${lowStockData?.daysRemaining !== 1 ? 's' : ''}!
                </div>
                <div style="color: #9a3412; font-size: 13px; line-height: 1.6;">
                    Baseado no uso diário de <strong>${lowStockData?.dailyUsage || '1.0'}</strong> ${lowStockData?.unit || 'unidades'}, recomendamos fazer a reposição o quanto antes.
                </div>
            </div>

            <!-- WhatsApp CTA -->
            ${lowStockData?.whatsappLink ? `
            <div style="background: #dcfce7; border: 2px solid #86efac; border-radius: 12px; padding: 24px; text-align: center; margin: 25px 0;">
                <div style="color: #166534; font-size: 14px; font-weight: 600; margin-bottom: 12px;">
                    🛒 COMPRAR AGORA NO WhatsApp
                </div>
                <a href="${lowStockData.whatsappLink}" target="_blank" style="display: inline-block; background-color: #25d366; color: #ffffff !important; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 211, 102, 0.3); transition: all 0.2s;">
                    💬 Enviar Mensagem
                </a>
                <div style="color: #15803d; font-size: 12px; margin-top: 12px; font-style: italic;">
                    Mensagem pré-formatada com detalhes do medicamento
                </div>
            </div>
            ` : ''}

            <!-- Configuração Alert -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin: 20px 0; font-size: 12px; color: #64748b; text-align: center;">
                ⚙️ Este alerta é disparado quando o estoque fica abaixo de <strong>${threshold} dias</strong>. Você recebe no máximo 1 alerta por dia por medicamento.
            </div>

            <div class="cta-container">
              <a href="${frontendUrl}/app" class="button" style="background-color: #f59e0b;">Acessar Sistema</a>
            </div>
          </div>
        `);
      }

      if (type === 'weekly_summary') {
        const { weeklyData } = data;

        return baseHtml(`
          <div class="header" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">
             <div style="background: rgba(255,255,255,0.2); width: 64px; height: 64px; border-radius: 50%; display: block; text-align: center; line-height: 64px; margin: 0 auto 15px auto; font-size: 32px; color: transparent; text-shadow: 0 0 0 #ffffff;">📊</div>
             <h1>Resumo Semanal</h1>
             <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0; font-weight: 500;">${weeklyData.period}</p>
          </div>
          <div class="content">
            <div class="welcome-text" style="color: #8b5cf6;">Olá, ${weeklyData.caregiverName}!</div>
            <p>Segue o resumo de adesão aos medicamentos da semana passada para os pacientes que você acompanha.</p>
            
            ${weeklyData.patients.map((patient, index) => `
              <!-- Card do Paciente -->
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin: ${index > 0 ? '24' : '16'}px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <!-- Header do Paciente -->
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
                  <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; color: white;">
                    ${patient.patientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style="font-size: 18px; font-weight: 700; color: #1e293b;">${patient.patientName}</div>
                    <div style="font-size: 13px; color: #64748b;">Paciente</div>
                  </div>
                </div>
                
                <!-- Grid de Métricas -->
                <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                  <!-- Total -->
                  <div style="flex: 1; min-width: 100px; background: #eff6ff; border: 1px solid #dbeafe; border-radius: 12px; padding: 16px; text-align: center;">
                    <div style="color: #1e40af; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">TOTAL</div>
                    <div style="color: #1e3a8a; font-size: 28px; font-weight: 900;">${patient.total}</div>
                  </div>
                  
                  <!-- Tomadas -->
                  <div style="flex: 1; min-width: 100px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; text-align: center;">
                    <div style="color: #15803d; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">TOMADAS</div>
                    <div style="color: #166534; font-size: 28px; font-weight: 900;">${patient.taken}</div>
                  </div>
                  
                  <!-- Pendentes -->
                  <div style="flex: 1; min-width: 100px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 16px; text-align: center;">
                    <div style="color: #c2410c; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">PENDENTES</div>
                    <div style="color: #9a3412; font-size: 28px; font-weight: 900;">${patient.pending}</div>
                  </div>
                </div>
                
                <!-- Card de Adesão (Destaque) -->
                <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border: 2px solid #e9d5ff; border-radius: 12px; padding: 20px; text-align: center;">
                  <div style="color: #7e22ce; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">TAXA DE ADESÃO</div>
                  <div style="color: #6b21a8; font-size: 42px; font-weight: 900; line-height: 1;">${patient.adherenceRate}%</div>
                  
                  <!-- Barra de Progresso -->
                  <div style="height: 8px; width: 100%; max-width: 250px; background: #e9d5ff; border-radius: 4px; margin: 16px auto 0; overflow: hidden;">
                    <div style="height: 100%; width: ${patient.adherenceRate}%; background: linear-gradient(90deg, #a855f7 0%, #9333ea 100%); border-radius: 4px; transition: width 0.3s ease;"></div>
                  </div>
                  
                  <!-- Emoji de Feedback -->
                  <div style="font-size: 32px; margin-top: 12px;">
                    ${patient.adherenceRate >= 90 ? '🎉' : patient.adherenceRate >= 70 ? '👍' : patient.adherenceRate >= 50 ? '😐' : '⚠️'}
                  </div>
                </div>
              </div>
            `).join('')}
            
            <!-- Resumo Geral -->
            ${weeklyData.patients.length > 1 ? `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-top: 24px; text-align: center;">
              <div style="color: #475569; font-size: 14px; font-weight: 600; margin-bottom: 8px;">
                📋 Total de ${weeklyData.patients.length} paciente${weeklyData.patients.length > 1 ? 's' : ''} acompanhado${weeklyData.patients.length > 1 ? 's' : ''}
              </div>
              <div style="color: #64748b; font-size: 13px;">
                Média geral de adesão: <strong style="color: #8b5cf6;">${Math.round(weeklyData.patients.reduce((sum, p) => sum + p.adherenceRate, 0) / weeklyData.patients.length)}%</strong>
              </div>
            </div>
            ` : ''}

            <div class="cta-container">
              <a href="${frontendUrl}/app" class="button" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">Ver Detalhes no App</a>
            </div>
            
            <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 20px;">
              📧 Você recebe este resumo toda segunda-feira às 9h da manhã.<br/>
              Gerado automaticamente pelo SiG Remédios.
            </p>
          </div>
        `);
      }

      // Default: Sharing/Invite
      return baseHtml(`
        <div class="header">
          <h1>SiG Remédios 💊</h1>
        </div>
        <div class="content">
          <div class="welcome-text">Olá!</div>
          <p>${data.text ? String(data.text).replace(/\n/g, '<br>') : ''}</p>
          
          ${data.observations ? `
          <div class="message-box">
            <strong>📝 Informação Adicional:</strong><br/>
            ${data.observations}
          </div>
          ` : ''}

          <div class="cta-container">
            <a href="${frontendUrl}" class="button">Acessar Sistema</a>
          </div>
        </div>
      `);
    };

    const htmlTemplate = getTemplate(type, {
      text,
      observations,
      senderName: senderName || 'Visitante',
      senderEmail: senderEmail || 'Não informado',
      message: text,
      sosData,
      healthLogsData,
      healthLogsByPatient,
      phone // <--- Added phone here
    });

    // Configurar email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const mailOptions = {
      from: `"SiG Remédios" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: htmlTemplate,
      text: `${text}\n\n${observations || ''}\n\nAcesse: ${frontendUrl}`,
      attachments: attachments
    };

    // Enviar email
    console.log('Tentando enviar email para:', to);
    const info = await transporter.sendMail(mailOptions);
    console.log('Transporter response:', info);


    console.log('Email enviado com sucesso:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      message: 'Email enviado com sucesso'
    };

  } catch (error) {
    console.error('Erro ao enviar email:', error);

    // Tratar erro específico do Gmail (Senha de App requerida)
    if (error.response && error.response.includes('534') && error.response.includes('5.7.9')) {
      throw new Error('É necessário usar Senha de App no Gmail (Erro 534). Veja as instruções no passo-a-passo.');
    }

    throw error;
  }
};

// Função para verificar configuração
export const verifyConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Servidor SMTP configurado corretamente');
    return true;
  } catch (error) {
    console.error('❌ Erro na configuração SMTP:', error.message);
    return false;
  }
};
