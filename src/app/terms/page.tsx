import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/src/components/home/nav";
import Footer from "@/src/components/home/footer";
import { CONTACT_EMAIL, SITE_URL, TRIAL_DAYS } from "@/src/lib/constants";

function EmailLink(): React.ReactElement {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
      {CONTACT_EMAIL}
    </a>
  );
}

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "As regras de uso do Fluizer: conta, planos, teste grátis, cancelamento e responsabilidades.",
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1 max-w-3xl mx-auto px-6 pt-28 pb-20 w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Termos de Uso
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Última atualização: novembro de 2026
        </p>

        <p className="text-sm bg-[#F5F5F7] dark:bg-[#111111] border border-border rounded-lg px-4 py-3 mb-10 leading-relaxed">
          Este site e o produto Fluizer são de propriedade e operados por Head
          Souza Serviços Digitais LTDA, CNPJ 49.481.141/0001-62.
        </p>

        <section>
          <h2 className="text-lg font-semibold mt-10 mb-3">O serviço</h2>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            O Fluizer é um serviço de prática de inglês no app web. O usuário
            cria uma atividade a partir de um objetivo e um assunto, ou a partir
            de material de estudo próprio (texto, imagem ou PDF), e responde
            perguntas curtas sobre esse conteúdo, no seu ritmo, com feedback e
            revisão espaçada. O WhatsApp é usado para o código de acesso e para
            lembretes, quando o usuário tem telefone na conta.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            O serviço utiliza modelos de inteligência artificial dos
            fornecedores Anthropic, OpenAI e Google como motores de
            processamento. Por essa razão, perguntas, avaliações e feedbacks são
            gerados por IA e podem conter inconsistências. O Fluizer não garante
            perfeição nas respostas geradas.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-10 mb-3">Planos</h2>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            <strong>Trial:</strong> período inicial gratuito de acesso completo
            ao produto por tempo limitado, sem necessidade de cartão ou
            pagamento. A duração padrão é de {TRIAL_DAYS} dias, podendo variar conforme
            campanhas e parcerias. Não há renovação automática do trial.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            <strong>Pro:</strong> plano pago por assinatura recorrente no
            cartão, com cobrança mensal ou anual conforme o plano escolhido. O
            valor vigente é informado no momento da contratação. A assinatura
            renova automaticamente ao fim de cada período e a cobrança independe
            do nível de interação ou engajamento do usuário no período.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            <strong>Cancelamento:</strong> a assinatura no cartão pode ser
            cancelada a qualquer momento em &quot;Assinatura&quot;, no menu da
            conta; acesso pago por outro meio é cancelado pelo suporte. Após o
            cancelamento, o acesso continua até o fim do período já pago e não
            há nova cobrança.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            <strong>Reembolso:</strong> reembolso integral em até 7 dias após
            cada pagamento, solicitado pelo suporte.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-10 mb-3">
            Cadastro e identificação
          </h2>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            O acesso é feito com a conta Google ou com o número de telefone,
            validado por código de verificação enviado pelo WhatsApp. O trial
            começa no primeiro acesso, sem cadastro manual.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            Para upgrade ao plano Pro, podem ser solicitadas informações
            adicionais para identificação e processamento da cobrança.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            Após expiração do trial sem conversão para o plano Pro, a conta é
            bloqueada até que o upgrade seja realizado.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-10 mb-3">
            Como usar o serviço
          </h2>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            Na atividade por material, o usuário deve enviar arquivos nos
            formatos suportados (texto, imagem, PDF), com conteúdo relevante
            para estudo de inglês.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            Em caso de dúvida sobre compatibilidade de material, o usuário pode
            falar com o suporte pelo menu da conta, dentro do app, ou pelo
            e-mail <EmailLink />.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-10 mb-3">
            Comunicações automáticas
          </h2>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            O produto envia mensagens automáticas para manter a prática ativa,
            como lembretes de estudo (por WhatsApp ou e-mail, quando o usuário
            ativa), avisos de status da conta e mensagens de retomada após um
            período sem praticar.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            Podemos ocasionalmente entrar em contato para coleta de feedback e
            informações úteis para melhoria do produto. Essas solicitações não
            são obrigatórias.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-10 mb-3">
            Conteúdo e material
          </h2>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            O Fluizer não é uma escola de idiomas e não oferece currículo
            próprio obrigatório. O serviço processa o material enviado pelo
            próprio usuário. Podemos disponibilizar materiais próprios como
            vocabulários, textos e conteúdos de exemplo, mas isso não
            caracteriza o Fluizer como instituição de ensino.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            O usuário pode enviar material proveniente de cursos, escolas ou
            qualquer outra fonte. O Fluizer não tem responsabilidade sobre a
            origem, autoria ou direitos autorais do material enviado. Essa
            responsabilidade é exclusiva do usuário. Não temos vínculo com
            escolas, cursos ou instituições cujo material possa ser enviado ao
            produto.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-10 mb-3">
            Sua responsabilidade sobre o conteúdo
          </h2>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            O conteúdo das perguntas e respostas geradas é dependente do
            material enviado pelo usuário. É de total responsabilidade do
            usuário não enviar documentos contendo dados pessoais sensíveis,
            senhas próprias ou de terceiros, ou qualquer informação
            confidencial.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            O envio de materiais com conteúdo inapropriado, de baixo calão,
            violento, relacionado a armas, drogas, bebidas alcoólicas ou
            qualquer conteúdo contrário à legislação brasileira é de
            responsabilidade exclusiva do usuário. O Fluizer não tem controle
            sobre o conteúdo do material enviado.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-10 mb-3">
            Processamento por IA
          </h2>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            O produto utiliza modelos de inteligência artificial dos
            fornecedores Anthropic, OpenAI e Google. Os dados transitam por
            essas plataformas para geração de perguntas e avaliação de
            respostas.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            É de total responsabilidade do usuário não enviar documentos com
            dados pessoais, senhas ou informações confidenciais próprias ou de
            terceiros.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-10 mb-3">Suporte</h2>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            Pelo Suporte, no menu da conta dentro do app, ou pelo e-mail{" "}
            <EmailLink />.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-10 mb-3">Idade mínima</h2>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            O serviço é destinado a maiores de 18 anos. Menores de 18 anos só
            podem usar com autorização e acompanhamento do responsável legal,
            que responde pelo uso e pela contratação.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-10 mb-3">
            Exclusão da conta
          </h2>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            O usuário pode pedir a exclusão da conta a qualquer momento pelo
            Suporte ou pelo e-mail <EmailLink />. A exclusão não cancela
            sozinha uma assinatura ativa no cartão, que deve ser cancelada antes
            em &quot;Assinatura&quot;, no menu da conta. O tratamento dos dados
            depois da exclusão está na{" "}
            <Link href="/privacy" className="underline underline-offset-2">
              Política de Privacidade
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-10 mb-3">
            Alterações destes termos
          </h2>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            Estes termos podem mudar. A data no topo da página mostra a versão
            em vigor, e o uso do serviço depois da mudança vale como aceite da
            nova versão.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-10 mb-3">
            Lei aplicável e foro
          </h2>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            Estes termos seguem a lei brasileira, incluindo o Código de Defesa
            do Consumidor. Fica eleito o foro do domicílio do usuário.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mt-10 mb-3">Contato</h2>
          <p className="text-[15px] leading-relaxed text-foreground/80 mb-4">
            Dúvidas sobre estes termos: <EmailLink />.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
