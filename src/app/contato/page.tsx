import type { Metadata } from "next";
import Nav from "@/src/components/home/nav";
import Footer from "@/src/components/home/footer";
import { CONTACT_EMAIL, CONTACT_PATH, SITE_URL } from "@/src/lib/constants";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com o Fluizer: dúvidas, suporte, parcerias e pedidos sobre os seus dados.",
  alternates: { canonical: `${SITE_URL}${CONTACT_PATH}` },
};

const H2 = "text-lg font-semibold mt-10 mb-3";
const P = "text-[15px] leading-relaxed text-foreground/80 mb-4";

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1 max-w-3xl mx-auto px-6 pt-28 pb-20 w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Contato</h1>

        <p className={P}>
          Para dúvidas, sugestões, parcerias ou pedidos sobre os seus dados,
          escreva para{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline underline-offset-2"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>

        <section>
          <h2 className={H2}>Já usa o Fluizer?</h2>
          <p className={P}>
            O jeito mais rápido é o Suporte, no menu da conta dentro do app. A
            mensagem já chega ligada à sua conta, e a resposta vem pelo WhatsApp
            ou por e-mail.
          </p>
        </section>

        <section>
          <h2 className={H2}>Empresa</h2>
          <p className={P}>
            Head Souza Serviços Digitais LTDA, CNPJ 49.481.141/0001-62.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
