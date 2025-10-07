
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
        <div className="w-full max-w-4xl py-12">
            <Card className="bg-card/95 backdrop-blur-sm border-white/20 text-card-foreground">
                <CardHeader className="text-center items-center">
                    <div className="p-3 bg-primary/10 rounded-full mb-4">
                        <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-bold">Política de Privacidade</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Última atualização: {new Date().toLocaleDateString('pt-BR')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground space-y-6">
                    <section>
                        <h2 className="text-foreground font-semibold">1. Introdução</h2>
                        <p>
                            A BMV ("nós", "nosso") está comprometida em proteger sua privacidade. Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações quando você utiliza nossa plataforma de monitoramento do Índice UCS ("Plataforma"). Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-foreground font-semibold">2. Coleta de Dados</h2>
                        <p>Coletamos as seguintes informações pessoais para fornecer e melhorar nossos serviços:</p>
                        <ul>
                            <li><strong>Informações de Identificação:</strong> Nome, endereço de e-mail e número de telefone.</li>
                            <li><strong>Dados de Autenticação:</strong> Senhas (de forma criptografada) e credenciais de acesso.</li>
                            <li><strong>Dados de Uso:</strong> Informações sobre como você interage com a Plataforma, como logs de acesso, endereços IP, tipo de navegador e páginas visitadas, para fins de segurança e melhoria.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-foreground font-semibold">3. Uso de Suas Informações</h2>
                        <p>Utilizamos as informações que coletamos para os seguintes propósitos:</p>
                        <ul>
                            <li>Para criar e gerenciar sua conta e permitir o acesso à Plataforma.</li>
                            <li>Para garantir a segurança da Plataforma, prevenindo fraudes e acessos não autorizados.</li>
                            <li>Para nos comunicarmos com você sobre sua conta ou atualizações importantes da Plataforma.</li>
                            <li>Para cumprir com nossas obrigações legais e regulatórias.</li>
                            <li>Para melhorar a funcionalidade e a experiência do usuário em nossa Plataforma.</li>
                        </ul>
                    </section>
                    
                    <section>
                        <h2 className="text-foreground font-semibold">4. Compartilhamento de Dados</h2>
                        <p>
                            A BMV não vende ou aluga suas informações pessoais. Podemos compartilhar suas informações apenas com provedores de serviços essenciais que nos auxiliam na operação da Plataforma (como Google Cloud e Firebase para hospedagem e autenticação), que estão contratualmente obrigados a proteger seus dados e usá-los apenas para os fins definidos.
                        </p>
                    </section>
                    
                    <section>
                        <h2 className="text-foreground font-semibold">5. Segurança dos Dados</h2>
                        <p>
                            Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso, alteração, divulgação ou destruição não autorizada. Isso inclui criptografia de dados, controle de acesso restrito e monitoramento de segurança contínuo.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-foreground font-semibold">6. Seus Direitos Conforme a LGPD</h2>
                        <p>Você, como titular dos dados, possui os seguintes direitos:</p>
                        <ul>
                            <li><strong>Confirmação e Acesso:</strong> O direito de saber se tratamos seus dados e de acessá-los.</li>
                            <li><strong>Correção:</strong> O direito de solicitar a correção de dados incompletos, inexatos ou desatualizados.</li>
                            <li><strong>Anonimização e Exclusão:</strong> O direito de solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a LGPD.</li>
                            <li><strong>Portabilidade:</strong> O direito de solicitar a portabilidade dos seus dados a outro fornecedor de serviço.</li>
                            <li><strong>Revogação do Consentimento:</strong> O direito de revogar seu consentimento a qualquer momento.</li>
                        </ul>
                        <p>Para exercer seus direitos, entre em contato conosco através do e-mail: <a href="mailto:privacidade@bmv.digital" className="text-primary">privacidade@bmv.digital</a>.</p>
                    </section>
                    
                    <section>
                        <h2 className="text-foreground font-semibold">7. Uso de Cookies</h2>
                        <p>
                            Nossa plataforma utiliza cookies essenciais para o funcionamento, como os de autenticação e segurança. Também usamos cookies para análise de tráfego, que nos ajudam a melhorar o serviço. Você pode gerenciar suas preferências de cookies através do nosso banner de consentimento.
                        </p>
                    </section>
                    
                    <section>
                        <h2 className="text-foreground font-semibold">8. Alterações a esta Política</h2>
                        <p>
                            Podemos atualizar esta Política de Privacidade de tempos em tempos. Notificaremos você sobre quaisquer alterações, publicando a nova política nesta página e atualizando a data da "última atualização".
                        </p>
                    </section>

                    <section>
                        <h2 className="text-foreground font-semibold">9. Contato</h2>
                        <p>
                            Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco pelo e-mail: <a href="mailto:privacidade@bmv.digital" className="text-primary">privacidade@bmv.digital</a>.
                        </p>
                    </section>

                    <div className="pt-8 flex justify-center">
                        <Button onClick={() => router.push('/dashboard')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar para o Dashboard
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
