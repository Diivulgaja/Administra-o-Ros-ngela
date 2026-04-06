window.AdminUtils = (() => {
  const locale = ADMIN_CONFIG.locale || 'pt-BR';
  const currency = ADMIN_CONFIG.currency || 'BRL';

  const money = (value = 0) => new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(value || 0));
  const number = (value = 0) => new Intl.NumberFormat(locale).format(Number(value || 0));
  const dateLabel = (value) => value ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`)) : '-';
  const dateTimeLabel = (value) => value ? new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '-';
  const timeLabel = (value) => value ? new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '-';
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const normalize = (text = '') => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const escapeHtml = (text = '') => String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
  const weekdayLabel = (weekday) => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][Number(weekday)] || '-';

  const statusClass = (status = '') => {
    const key = normalize(status);
    if (key.includes('confirm') || key.includes('approved') || key.includes('aprov')) return 'status-confirmado';
    if (key.includes('pend') || key.includes('aguard')) return 'status-aguardando';
    if (key.includes('expir')) return 'status-pre-reserva';
    if (key.includes('cancel') || key.includes('hidden') || key.includes('ocult') || key.includes('reprov')) return 'status-cancelado';
    if (key.includes('attend') || key.includes('concl') || key.includes('destaq') || key.includes('reply') || key.includes('respond')) return 'status-concluido';
    return 'status-pre-reserva';
  };

  const paymentStatusLabel = (status = '') => ({ pending: 'Pendente', paid: 'Pago', refunded: 'Reembolsado', partial: 'Parcial', failed: 'Falhou' }[status] || status || '-');
  const appointmentStatusLabel = (status = '') => ({ pending: 'Pendente', confirmed: 'Confirmado', cancelled: 'Cancelado', expired: 'Expirado' }[status] || status || '-');
  const attendanceStatusLabel = (status = '') => ({ scheduled: 'Agendado', attended: 'Concluído', completed: 'Concluído', no_show: 'Faltou', cancelled: 'Cancelado' }[status] || status || '-');

  return { money, number, dateLabel, dateTimeLabel, timeLabel, todayIso, initials, normalize, escapeHtml, statusClass, weekdayLabel, paymentStatusLabel, appointmentStatusLabel, attendanceStatusLabel };
})();
