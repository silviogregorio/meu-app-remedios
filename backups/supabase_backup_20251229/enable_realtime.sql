/**
 * ATIVAR REALTIME PARA A TABELA SOS_ALERTS
 * Este comando é necessário para que o Backend consiga "escutar" os inserts na tabela.
 * Sem isso, o evento 'INSERT' não é transmitido via Socket.
 */

-- Adicionar a tabela à publicação padrão do Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sos_alerts;
