import React from 'react';
import { Shield, Eye, Lock, Database, UserCheck, Settings, AlertTriangle, Mail } from 'lucide-react';

const Privacy: React.FC = () => {
  const sections = [
    {
      id: 'introducao',
      title: '1. Introdução',
      icon: Shield,
      content: [
        'A THEADORO respeita sua privacidade e está comprometida em proteger seus dados pessoais.',
        'Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas informações.',
        'Estamos em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).',
        'Ao utilizar nossa plataforma, você concorda com as práticas descritas nesta política.'
      ]
    },
    {
      id: 'definicoes',
      title: '2. Definições Importantes',
      icon: Database,
      content: [
        'Dados Pessoais: Informações que podem identificar você direta ou indiretamente.',
        'Dados Sensíveis: Informações sobre origem racial, convicções religiosas, opiniões políticas, saúde, vida sexual, dados genéticos ou biométricos.',
        'Titular: Você, pessoa natural a quem se referem os dados pessoais.',
        'Controlador: THEADORO, responsável pelas decisões sobre o tratamento dos dados.',
        'Operador: Terceiros que realizam o tratamento de dados em nome da THEADORO.',
        'Tratamento: Qualquer operação com dados pessoais (coleta, uso, armazenamento, etc.).'
      ]
    },
    {
      id: 'coleta',
      title: '3. Dados que Coletamos',
      icon: Database,
      content: [
        'Dados de Identificação: Nome, CPF, RG, data de nascimento.',
        'Dados de Contato: Email, telefone, endereço postal.',
        'Dados de Acesso: Login, senha (criptografada), histórico de navegação.',
        'Dados de Pagamento: Informações de cartão (tokenizadas), histórico de transações.',
        'Dados de Localização: Endereço de entrega, geolocalização (quando autorizada).',
        'Dados de Uso: Páginas visitadas, produtos visualizados, tempo de permanência.',
        'Dados de Dispositivo: Tipo de dispositivo, sistema operacional, navegador, IP.',
        'Dados de Comunicação: Mensagens enviadas através da plataforma, avaliações.'
      ]
    },
    {
      id: 'finalidades',
      title: '4. Como Usamos seus Dados',
      icon: Eye,
      content: [
        'Prestação de Serviços: Processar pedidos, facilitar transações, entregar produtos.',
        'Comunicação: Enviar confirmações, atualizações de pedidos, suporte ao cliente.',
        'Personalização: Recomendar produtos, personalizar experiência de navegação.',
        'Marketing: Enviar ofertas, promoções e newsletters (com seu consentimento).',
        'Segurança: Prevenir fraudes, proteger a plataforma e usuários.',
        'Cumprimento Legal: Atender obrigações fiscais, contábeis e regulatórias.',
        'Melhoria dos Serviços: Analisar uso da plataforma, desenvolver novos recursos.',
        'Resolução de Disputas: Mediar conflitos entre compradores e vendedores.'
      ]
    },
    {
      id: 'base-legal',
      title: '5. Base Legal para Tratamento',
      icon: UserCheck,
      content: [
        'Consentimento: Para marketing, newsletters e funcionalidades opcionais.',
        'Execução de Contrato: Para processar pedidos e prestar serviços contratados.',
        'Interesse Legítimo: Para segurança, prevenção de fraudes e melhoria dos serviços.',
        'Cumprimento de Obrigação Legal: Para atender exigências fiscais e regulatórias.',
        'Proteção da Vida: Em situações de emergência que requeiram ação imediata.',
        'Exercício de Direitos: Para defesa em processos judiciais ou administrativos.'
      ]
    },
    {
      id: 'compartilhamento',
      title: '6. Compartilhamento de Dados',
      icon: UserCheck,
      content: [
        'Vendedores: Dados necessários para processamento e entrega de pedidos.',
        'Processadores de Pagamento: Para processar transações financeiras com segurança.',
        'Transportadoras: Dados de entrega para envio de produtos.',
        'Prestadores de Serviços: Empresas que nos auxiliam na operação da plataforma.',
        'Autoridades: Quando exigido por lei ou ordem judicial.',
        'Parceiros Comerciais: Com seu consentimento explícito para ofertas específicas.',
        'Nunca vendemos seus dados pessoais para terceiros.',
        'Todos os parceiros assinam acordos de proteção de dados.'
      ]
    },
    {
      id: 'armazenamento',
      title: '7. Armazenamento e Segurança',
      icon: Lock,
      content: [
        'Dados armazenados em servidores seguros com criptografia avançada.',
        'Acesso restrito apenas a funcionários autorizados e necessários.',
        'Backups regulares e planos de recuperação de desastres.',
        'Monitoramento contínuo contra tentativas de acesso não autorizado.',
        'Certificações de segurança ISO 27001 e SOC 2.',
        'Dados de pagamento processados conforme padrões PCI DSS.',
        'Senhas protegidas com hash e salt criptográficos.',
        'Logs de acesso mantidos para auditoria e investigação.'
      ]
    },
    {
      id: 'retencao',
      title: '8. Retenção de Dados',
      icon: Database,
      content: [
        'Dados de conta: Mantidos enquanto a conta estiver ativa.',
        'Dados de transação: 5 anos para fins fiscais e contábeis.',
        'Dados de marketing: Até revogação do consentimento.',
        'Dados de suporte: 3 anos após resolução do último atendimento.',
        'Dados de segurança: 2 anos para investigação de fraudes.',
        'Dados de navegação: 12 meses para análise e melhoria.',
        'Após os prazos, dados são anonimizados ou excluídos.',
        'Alguns dados podem ser mantidos por obrigação legal.'
      ]
    },
    {
      id: 'direitos',
      title: '9. Seus Direitos (LGPD)',
      icon: UserCheck,
      content: [
        'Confirmação: Saber se tratamos seus dados pessoais.',
        'Acesso: Obter cópia dos dados que possuímos sobre você.',
        'Correção: Solicitar correção de dados incompletos ou incorretos.',
        'Anonimização/Bloqueio: Solicitar anonimização ou bloqueio de dados.',
        'Eliminação: Solicitar exclusão de dados desnecessários ou tratados irregularmente.',
        'Portabilidade: Receber seus dados em formato estruturado e interoperável.',
        'Informação: Saber com quem compartilhamos seus dados.',
        'Revogação: Retirar consentimento a qualquer momento.',
        'Oposição: Opor-se ao tratamento baseado em interesse legítimo.',
        'Revisão: Solicitar revisão de decisões automatizadas.'
      ]
    },
    {
      id: 'exercer-direitos',
      title: '10. Como Exercer seus Direitos',
      icon: Settings,
      content: [
        'Acesse sua conta e vá em "Configurações de Privacidade".',
        'Envie email para privacidade@theadoro.com.br.',
        'Entre em contato através do formulário de contato.',
        'Ligue para (11) 3456-7890 e solicite falar com o DPO.',
        'Responderemos em até 15 dias conforme exigido pela LGPD.',
        'Algumas solicitações podem requerer verificação de identidade.',
        'Não cobramos taxas para exercício de direitos.',
        'Você pode designar representante legal para exercer seus direitos.'
      ]
    },
    {
      id: 'cookies',
      title: '11. Cookies e Tecnologias Similares',
      icon: Settings,
      content: [
        'Cookies Essenciais: Necessários para funcionamento básico da plataforma.',
        'Cookies de Performance: Coletam informações sobre uso da plataforma.',
        'Cookies de Funcionalidade: Lembram suas preferências e configurações.',
        'Cookies de Marketing: Personalizam anúncios e medem efetividade.',
        'Você pode gerenciar cookies nas configurações do navegador.',
        'Alguns cookies são necessários e não podem ser desabilitados.',
        'Usamos Google Analytics, Facebook Pixel e outras ferramentas.',
        'Cookies de terceiros seguem as políticas de seus respectivos fornecedores.'
      ]
    },
    {
      id: 'menores',
      title: '12. Proteção de Menores',
      icon: Shield,
      content: [
        'Não coletamos intencionalmente dados de menores de 13 anos.',
        'Menores entre 13 e 18 anos precisam de autorização dos responsáveis.',
        'Pais/responsáveis podem solicitar exclusão de dados de menores.',
        'Implementamos verificações de idade em processos de cadastro.',
        'Dados de menores recebem proteção adicional.',
        'Educamos sobre uso seguro da internet e proteção de dados.',
        'Cooperamos com autoridades em casos de proteção de menores.'
      ]
    },
    {
      id: 'transferencia',
      title: '13. Transferência Internacional',
      icon: Database,
      content: [
        'Alguns dados podem ser processados fora do Brasil.',
        'Transferências seguem adequação exigida pela LGPD.',
        'Países com nível adequado de proteção conforme ANPD.',
        'Cláusulas contratuais padrão para proteção de dados.',
        'Você será informado sobre transferências quando relevante.',
        'Dados sensíveis recebem proteção adicional em transferências.',
        'Monitoramos continuamente adequação de países de destino.'
      ]
    },
    {
      id: 'alteracoes',
      title: '14. Alterações nesta Política',
      icon: AlertTriangle,
      content: [
        'Podemos atualizar esta política periodicamente.',
        'Alterações significativas serão comunicadas por email.',
        'Versão atualizada será publicada na plataforma.',
        'Data da última atualização sempre indicada.',
        'Uso continuado constitui aceitação das alterações.',
        'Você pode solicitar histórico de versões anteriores.',
        'Alterações entram em vigor 30 dias após publicação.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Política de Privacidade
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed">
            Sua privacidade é nossa prioridade. Conheça como protegemos e tratamos seus dados pessoais em conformidade com a LGPD.
          </p>
          <div className="mt-8 text-sm opacity-90">
            <p>Última atualização: Janeiro de 2024 | Em conformidade com a LGPD</p>
          </div>
        </div>
      </section>

      {/* LGPD Compliance Badge */}
      <section className="py-8 bg-green-50 border-b border-green-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-4 text-green-800">
            <Shield className="w-8 h-8" />
            <div className="text-center">
              <h2 className="text-xl font-bold">Conformidade LGPD</h2>
              <p className="text-sm">Lei Geral de Proteção de Dados - Lei 13.709/2018</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Acesso Rápido</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="#direitos" className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <UserCheck className="w-6 h-6 text-blue-600" />
              <span className="font-medium text-blue-800">Seus Direitos</span>
            </a>
            <a href="#exercer-direitos" className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <Settings className="w-6 h-6 text-green-600" />
              <span className="font-medium text-green-800">Como Exercer</span>
            </a>
            <a href="#coleta" className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <Database className="w-6 h-6 text-purple-600" />
              <span className="font-medium text-purple-800">Dados Coletados</span>
            </a>
            <a href="#seguranca" className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
              <Lock className="w-6 h-6 text-red-600" />
              <span className="font-medium text-red-800">Segurança</span>
            </a>
          </div>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            <div className="mb-12 p-6 bg-blue-50 rounded-lg border border-blue-100">
              <h2 className="text-2xl font-bold mb-4 text-blue-800">Compromisso com sua Privacidade</h2>
              <p className="text-blue-700 leading-relaxed mb-4">
                Na THEADORO, acreditamos que a proteção de dados é um direito fundamental. 
                Esta política explica de forma transparente como tratamos suas informações pessoais.
              </p>
              <div className="flex items-center space-x-4 text-sm text-blue-600">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>LGPD Compliant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Dados Criptografados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4" />
                  <span>Seus Direitos Garantidos</span>
                </div>
              </div>
            </div>

            {/* Privacy Sections */}
            <div className="space-y-12">
              {sections.map((section) => (
                <div key={section.id} id={section.id} className="scroll-mt-20">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <section.icon className="w-6 h-6 text-green-600" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                      {section.title}
                    </h2>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <ul className="space-y-4">
                      {section.content.map((item, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-gray-700 leading-relaxed">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* DPO Contact */}
            <div className="mt-16 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100">
              <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center space-x-2">
                <Mail className="w-6 h-6 text-blue-600" />
                <span>Encarregado de Proteção de Dados (DPO)</span>
              </h3>
              <p className="text-gray-700 mb-4">
                Para questões específicas sobre proteção de dados, entre em contato com nosso DPO:
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> dpo@theadoro.com.br</p>
                <p><strong>Telefone:</strong> (11) 3456-7890 (ramal 100)</p>
                <p><strong>Endereço:</strong> Rua das Flores, 123 - Vila Madalena - São Paulo/SP</p>
                <p><strong>Horário:</strong> Segunda a Sexta, 9h às 18h</p>
              </div>
            </div>

            {/* Rights Summary */}
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="font-bold text-blue-800 mb-3 flex items-center space-x-2">
                  <UserCheck className="w-5 h-5" />
                  <span>Exercer Direitos</span>
                </h4>
                <p className="text-blue-700 text-sm mb-3">
                  Acesse, corrija, exclua ou porte seus dados facilmente:
                </p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  Gerenciar Dados
                </button>
              </div>

              <div className="p-6 bg-green-50 rounded-lg border border-green-100">
                <h4 className="font-bold text-green-800 mb-3 flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Denunciar Violação</span>
                </h4>
                <p className="text-green-700 text-sm mb-3">
                  Suspeita de uso inadequado dos seus dados?
                </p>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">
                  Reportar Problema
                </button>
              </div>
            </div>

            {/* ANPD Contact */}
            <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-2">Autoridade Nacional de Proteção de Dados (ANPD)</h4>
                  <p className="text-yellow-700 text-sm leading-relaxed">
                    Você também pode entrar em contato diretamente com a ANPD através do site 
                    <strong> gov.br/anpd</strong> ou pelo telefone <strong>0800-285-0197</strong> 
                    para questões sobre proteção de dados pessoais.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Privacy;