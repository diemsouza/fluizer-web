import type { Metadata } from "next";
import Nav from "@/src/components/home/nav";
import Footer from "@/src/components/home/footer";
import {
  CONSENT_COOKIE_NAME,
  CONTACT_EMAIL,
  SITE_URL,
} from "@/src/lib/constants";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Quais dados o Fluizer coleta, como usa e como protege as suas informações.",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

const H2 = "text-lg font-semibold mt-10 mb-3";
const P = "text-[15px] leading-relaxed text-foreground/80 mb-4";
const UL = "text-[15px] leading-relaxed text-foreground/80 mb-4 list-disc pl-5 space-y-2";

const VENDORS = [
  ["OpenAI e Anthropic", "geração de perguntas e avaliação de respostas por IA, transcrição de voz, voz das perguntas e do feedback e imagens das perguntas"],
  ["Google", "login com Google e, em alguns casos, voz das perguntas e do feedback"],
  ["Meta (WhatsApp)", "envio do código de acesso e dos lembretes para quem tem telefone na conta"],
  ["Stripe", "pagamento da assinatura"],
  ["Supabase", "banco de dados e armazenamento de arquivos"],
  ["Vercel", "hospedagem do site e do app"],
  ["Provedor de e-mail", "envio de lembretes e respostas do suporte por e-mail"],
  ["Google Analytics, Google Tag Manager e Microsoft Clarity", "análise de uso do site, só com o seu consentimento"],
] as const;

function EmailLink(): React.ReactElement {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
      {CONTACT_EMAIL}
    </a>
  );
}

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1 max-w-3xl mx-auto px-6 pt-28 pb-20 w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Política de Privacidade
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Última atualização: novembro de 2026
        </p>

        <p className="text-sm bg-[#F5F5F7] dark:bg-[#111111] border border-border rounded-lg px-4 py-3 mb-10 leading-relaxed">
          Este site e o produto Fluizer são de propriedade e operados por Head
          Souza Serviços Digitais LTDA, CNPJ 49.481.141/0001-62, controladora
          dos dados tratados aqui.
        </p>

        <section>
          <h2 className={H2}>Dados que coletamos</h2>
          <ul className={UL}>
            <li>
              <strong>Conta:</strong> número de telefone (quando você entra com
              código pelo WhatsApp) e/ou e-mail, nome e foto de perfil (quando
              você entra com Google). Também guardamos nível de inglês, fuso
              horário e horário do lembrete diário, quando você ativa.
            </li>
            <li>
              <strong>Prática:</strong> o pedido e o material de cada atividade
              (texto, imagem ou PDF), suas respostas em texto e em voz, e o
              histórico de perguntas, acertos, erros, avaliações das perguntas
              e intervalos de revisão.
            </li>
            <li>
              <strong>Pagamento:</strong> os dados do cartão ficam com a Stripe
              e não passam pelos nossos servidores. Guardamos só o plano, o
              valor, o período pago e o status da assinatura.
            </li>
            <li>
              <strong>Origem do acesso:</strong> quando você chega por um link
              de campanha, guardamos por 30 dias a origem (parâmetros utm,
              identificadores de clique do Google e da Meta, site de origem e
              página de entrada). Se você criar a conta nesse período, essa
              origem fica registrada na conta.
            </li>
            <li>
              <strong>Navegação:</strong> dados técnicos como tipo de
              dispositivo e navegador e, com o seu consentimento, dados de uso
              coletados pelas ferramentas de análise.
            </li>
            <li>
              <strong>Suporte:</strong> as mensagens que você manda pelo
              Suporte do app ou por e-mail.
            </li>
          </ul>
        </section>

        <section>
          <h2 className={H2}>Para que usamos</h2>
          <ul className={UL}>
            <li>Criar e manter a sua conta e o seu teste grátis</li>
            <li>Gerar as atividades, as perguntas e o feedback da prática</li>
            <li>
              Personalizar a prática com base no seu nível e no seu histórico
            </li>
            <li>
              Enviar o código de acesso, o lembrete diário (por WhatsApp ou
              e-mail) e avisos sobre a conta
            </li>
            <li>Cobrar a assinatura e responder pedidos de suporte</li>
            <li>
              Medir de onde vêm os acessos e melhorar o site e o produto
            </li>
          </ul>
        </section>

        <section>
          <h2 className={H2}>Base legal</h2>
          <p className={P}>
            Tratamos os dados com base na Lei Geral de Proteção de Dados (Lei
            13.709/2018), art. 7:
          </p>
          <ul className={UL}>
            <li>
              <strong>Execução do contrato:</strong> conta, prática, lembretes
              que você ativa, cobrança e suporte.
            </li>
            <li>
              <strong>Legítimo interesse:</strong> segurança, prevenção de
              abuso, registro da origem do acesso e melhoria do produto.
            </li>
            <li>
              <strong>Consentimento:</strong> cookies de análise. Você pode
              aceitar ou recusar no aviso de cookies.
            </li>
            <li>
              <strong>Obrigação legal:</strong> registros fiscais e de acesso
              que a lei manda guardar.
            </li>
          </ul>
        </section>

        <section>
          <h2 className={H2}>Fornecedores e compartilhamento</h2>
          <p className={P}>
            Não vendemos nem compartilhamos dados para fins comerciais. Os dados
            passam só pelos fornecedores necessários para o serviço funcionar,
            cada um com a sua própria política de privacidade:
          </p>
          <ul className={UL}>
            {VENDORS.map(([name, purpose]) => (
              <li key={name}>
                <strong>{name}:</strong> {purpose}.
              </li>
            ))}
          </ul>
          <p className={P}>
            Não envie materiais com dados pessoais sensíveis, senhas ou
            informações confidenciais suas ou de outras pessoas.
          </p>
        </section>

        <section>
          <h2 className={H2}>Transferência internacional</h2>
          <p className={P}>
            Boa parte desses fornecedores processa os dados fora do Brasil,
            principalmente nos Estados Unidos. A transferência acontece para
            executar o serviço que você contratou (LGPD, art. 33, IX).
          </p>
        </section>

        <section>
          <h2 className={H2}>Retenção de dados</h2>
          <p className={P}>
            Guardamos os arquivos da prática enquanto a conta existir: suas
            respostas em voz, as imagens de material que você envia e as
            imagens e áudios das perguntas. O texto extraído dos materiais, as
            perguntas e o histórico de prática também ficam guardados, porque a
            revisão espaçada depende deles.
          </p>
          <p className={P}>
            Quando você pede a exclusão da conta, apagamos os seus dados em até
            30 dias, menos o que a lei obriga a guardar por mais tempo, como
            registros fiscais de pagamento e registros de acesso.
          </p>
        </section>

        <section id="cookies">
          <h2 className={H2}>Cookies</h2>
          <ul className={UL}>
            <li>
              <strong>Essenciais:</strong> mantêm você logado, protegem o login
              com Google, lembram o tema claro ou escuro, o estado do menu
              lateral e a sua escolha sobre cookies (
              <code>{CONSENT_COOKIE_NAME}</code>). Não dependem de
              consentimento.
            </li>
            <li>
              <strong>Origem do acesso:</strong> guarda por 30 dias de qual
              campanha ou site você veio.
            </li>
            <li>
              <strong>Análise:</strong> Google Analytics e Microsoft Clarity
              (que grava a sessão e gera mapas de calor), carregados pelo Google
              Tag Manager. Só funcionam se você aceitar no aviso de cookies.
              Para mudar a escolha, apague os cookies do site no navegador e o
              aviso aparece de novo.
            </li>
          </ul>
        </section>

        <section>
          <h2 className={H2}>Seus direitos (LGPD)</h2>
          <p className={P}>
            Você pode pedir a qualquer momento: confirmação de que tratamos
            seus dados, acesso, correção, portabilidade, informação sobre com
            quem compartilhamos, revogação do consentimento e exclusão dos
            dados e da conta.
          </p>
          <p className={P}>
            Para excluir a conta ou exercer qualquer desses direitos, use o
            Suporte no menu da conta, dentro do app, ou escreva para{" "}
            <EmailLink />. Respondemos em até 15 dias.
          </p>
        </section>

        <section>
          <h2 className={H2}>Encarregado de dados</h2>
          <p className={P}>
            O contato do encarregado pelo tratamento de dados pessoais é{" "}
            <EmailLink />.
          </p>
        </section>

        <section>
          <h2 className={H2}>Alterações</h2>
          <p className={P}>
            Quando esta política mudar, a data no topo da página é atualizada.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
