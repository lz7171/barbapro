export const metadata = { title: 'Termos e privacidade' };
export default function Termos() {
  return (<div className="card legal"><h2>Termos de uso e Política de Privacidade</h2>
    <p><small>Texto-modelo. Antes de usar comercialmente, revise com um advogado e preencha razão social, CNPJ e e-mail de contato nos trechos indicados.</small></p>

    <h3>Quem somos</h3>
    <p>O BarbaPro é uma plataforma de agendamento e gestão para barbearias. Para os dados de agendamento, a barbearia escolhida pelo cliente é a controladora e o BarbaPro atua como operador. Para os pedidos de orçamento e contas de acesso, o controlador é o BarbaPro: [RAZÃO SOCIAL], CNPJ [CNPJ].</p>

    <h3>Quais dados coletamos e para quê</h3>
    <ul><li><b>Cliente que agenda:</b> nome e telefone, para confirmar, remarcar ou cancelar o horário e para a barbearia entrar em contato.</li>
      <li><b>Barbearia que pede orçamento:</b> nome, nome da barbearia, cidade, telefone, e-mail e mensagem, para responder à proposta.</li>
      <li><b>Donos e barbeiros:</b> e-mail e senha de acesso (a senha é guardada de forma criptografada) e dados de uso do painel.</li></ul>
    <p>Usamos esses dados com base na execução do serviço solicitado e no consentimento dado ao marcar a caixa de aceite (LGPD, Lei 13.709/2018).</p>

    <h3>Com quem compartilhamos</h3>
    <p>Os dados do agendamento ficam visíveis apenas para a barbearia escolhida. Não vendemos dados. Usamos provedores de infraestrutura (hospedagem e banco de dados) que tratam os dados em nosso nome.</p>

    <h3>Por quanto tempo guardamos</h3>
    <p>Mantemos os dados enquanto forem necessários para o atendimento e para obrigações legais. Pedidos de orçamento sem retorno podem ser apagados após 12 meses.</p>

    <h3>Seus direitos</h3>
    <p>Você pode pedir confirmação do tratamento, acesso, correção, anonimização ou exclusão dos seus dados e retirar o consentimento. Para dados de agendamento, fale com a barbearia. Para os demais, escreva para [E-MAIL DE CONTATO].</p>

    <h3>Segurança</h3>
    <p>Os dados trafegam com criptografia e cada barbearia só acessa os próprios dados. Nenhum sistema é totalmente imune a falhas; em caso de incidente relevante, avisaremos os afetados conforme a lei.</p>

    <h3>Cancelamento e remarcação</h3>
    <p>O cliente pode cancelar ou remarcar pelo link recebido após o agendamento, dentro do prazo definido por cada barbearia.</p></div>);
}
