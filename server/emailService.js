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
    }
  });
};

// Função para enviar email
export const sendEmail = async ({ to, subject, text, observations, type = 'invite', senderName, senderEmail, sosData, reportData, healthLogsData, healthLogsByPatient, attachments }) => {
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

            <div style="margin-top: 30px;">
                <h3 style="font-size: 16px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">💊 Medicamentos em Uso</h3>
                <div style="background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0;">
                    ${sosData.medications || 'Nenhum medicamento registrado.'}
                </div>
            </div>

            <div style="margin-top: 30px; background: #1e293b; color: white; padding: 20px; border-radius: 12px;">
                <span class="label" style="color: #94a3b8;">Contato de Emergência</span>
                <div style="font-size: 18px; font-weight: 700; margin-top: 5px;">
                    ${sosData.contacts && sosData.contacts[0] ? sosData.contacts[0].name : 'Responsável'}
                </div>
                <div style="font-size: 16px; opacity: 0.9; margin-top: 4px; color: #34d399;">
                    📞 ${sosData.contacts && sosData.contacts[0] ? sosData.contacts[0].phone : 'Ver app'}
                </div>
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
        const { senderName, senderEmail, message } = data;
        return baseHtml(`
          <div class="header" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);">
            <h1>SiG Remédios - Nova Mensagem 📬</h1>
          </div>
          <div class="content">
            <div class="welcome-text">Olá, Admin!</div>
            <p>Você recebeu uma nova mensagem através do portal <strong>SiG Remédios</strong>.</p>
            
            <div class="message-box">
              <span class="label">Remetente</span>
              <div class="value" style="margin-bottom: 12px;">${senderName} (${senderEmail})</div>
              
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
      healthLogsByPatient
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
    const info = await transporter.sendMail(mailOptions);


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
