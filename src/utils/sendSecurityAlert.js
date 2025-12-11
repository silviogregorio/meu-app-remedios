/**
 * Sends security alert email to admin
 * @param {Object} auditLog - Audit log entry
 * @param {Array} threats - Detected threats
 */
export const sendSecurityAlert = async (auditLog, threats, supabase) => {
    try {
        const threatsList = threats.map(t =>
            `<li><strong>${t.type}:</strong> ${t.description} (Severidade: ${t.severity})</li>`
        ).join('');

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🚨 ALERTA DE SEGURANÇA</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Nível de Risco: <strong>${auditLog.risk_level.toUpperCase()}</strong></p>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #111827; font-size: 18px; margin-top: 0;">Detalhes da Atividade</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Usuário:</td>
              <td style="padding: 8px 0;">${auditLog.user_email}</td>
            </tr>
            <tr style="background: #fff;">
              <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Ação:</td>
              <td style="padding: 8px 0;"><code style="background: #fee2e2; color: #dc2626; padding: 2px 6px; border-radius: 4px;">${auditLog.action}</code></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">IP Address:</td>
              <td style="padding: 8px 0;">${auditLog.ip_address || 'Desconhecido'}</td>
            </tr>
            <tr style="background: #fff;">
              <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Data/Hora:</td>
              <td style="padding: 8px 0;">${new Date(auditLog.created_at || Date.now()).toLocaleString('pt-BR')}</td>
            </tr>
          </table>

          <h3 style="color: #dc2626; font-size: 16px; margin-top: 20px;">Ameaças Detectadas:</h3>
          <ul style="color: #374151; line-height: 1.8;">
            ${threatsList}
          </ul>

          ${auditLog.metadata && Object.keys(auditLog.metadata).length > 0 ? `
            <div style="background: #fff; padding: 12px; border-radius: 6px; margin-top: 16px; border: 1px solid #e5e7eb;">
              <h4 style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Metadados:</h4>
              <pre style="margin: 0; font-size: 12px; color: #374151; overflow-x: auto;">${JSON.stringify(auditLog.metadata, null, 2)}</pre>
            </div>
          ` : ''}

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;">
            <p style="margin: 0;">Este é um alerta automático do sistema de segurança SiG Remédios.</p>
            <p style="margin: 8px 0 0 0;">Acesse o <a href="https://sigremedios.vercel.app/admin/security" style="color: #dc2626; text-decoration: none; font-weight: bold;">Dashboard de Segurança</a> para mais detalhes.</p>
          </div>
        </div>
      </div>
    `;

        const text = `
🚨 ALERTA DE SEGURANÇA [${auditLog.risk_level.toUpperCase()}]

Usuário: ${auditLog.user_email}
Ação: ${auditLog.action}
IP: ${auditLog.ip_address || 'Desconhecido'}
Data: ${new Date(auditLog.created_at || Date.now()).toLocaleString('pt-BR')}

Ameaças Detectadas:
${threats.map(t => `- ${t.type}: ${t.description} (${t.severity})`).join('\n')}

Acesse https://sigremedios.vercel.app/admin/security para mais detalhes.
    `;

        await supabase.functions.invoke('send-email', {
            body: {
                to: 'sigremedios@gmail.com',
                subject: `🚨 ALERTA DE SEGURANÇA [${auditLog.risk_level.toUpperCase()}] - ${auditLog.action}`,
                text,
                html,
                type: 'security_alert'
            }
        });

        console.log('✅ Security alert sent to sigremedios@gmail.com');
    } catch (error) {
        console.error('❌ Error sending security alert:', error);
    }
};
