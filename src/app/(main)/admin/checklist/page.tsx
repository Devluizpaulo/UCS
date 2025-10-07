
'use client';

import { useEffect } from 'react';
import Head from 'next/head';
import { Button } from '@/components/ui/button';

export default function AdminChecklistPage() {
  useEffect(() => {
    // A lógica interativa do checklist é executada aqui no cliente.
    const STORAGE_KEY = 'ucs_checklist_v2';
    const SIG_KEY = 'ucs_checklist_sigs_v2';
    const AUTOSAVE_DEBOUNCE = 600;

    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"][data-key]')) as HTMLInputElement[];
    const allCollapsibles = document.querySelectorAll('.collapsible');

    function updateProgressUI() {
      const total = checkboxes.length;
      const done = checkboxes.filter(cb => cb.checked).length;
      const pct = total === 0 ? 0 : Math.round((done / total) * 100);
      
      const progressTextEl = document.getElementById('progressText');
      if (progressTextEl) progressTextEl.textContent = `${pct}%`;
      
      const progressFill = document.getElementById('progressFill') as HTMLElement | null;
      if (progressFill) progressFill.style.width = `${pct}%`;

      const progressBigEl = document.getElementById('progressBig');
      if (progressBigEl) progressBigEl.textContent = `${pct}%`;

      const completedItemsEl = document.getElementById('completedItems');
      if(completedItemsEl) completedItemsEl.textContent = String(done);

      const totalItemsEl = document.getElementById('totalItems');
      if(totalItemsEl) totalItemsEl.textContent = String(total);
      
      const progressPctEl = document.getElementById('progressPct');
      if (progressPctEl) progressPctEl.textContent = `${pct}%`;
    }

    function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
      let timeoutId: ReturnType<typeof setTimeout>;
      return function(this: any, ...args: Parameters<T>) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
      };
    }

    function saveState() {
      const state: { [key: string]: boolean } = {};
      checkboxes.forEach(cb => {
        if (cb.dataset.key) {
          state[cb.dataset.key] = cb.checked;
        }
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      const sigs = {
        devName: (document.getElementById('sigDevName') as HTMLInputElement)?.value || '',
        devDate: (document.getElementById('sigDevDate') as HTMLInputElement)?.value || '',
        clientName: (document.getElementById('sigClientName') as HTMLInputElement)?.value || '',
        clientDate: (document.getElementById('sigClientDate') as HTMLInputElement)?.value || '',
      };
      localStorage.setItem(SIG_KEY, JSON.stringify(sigs));
      
      updateProgressUI();
    }

    const saveStateDebounced = debounce(saveState, AUTOSAVE_DEBOUNCE);

    function loadState() {
      const rawState = localStorage.getItem(STORAGE_KEY);
      if (rawState) {
        try {
          const state = JSON.parse(rawState);
          checkboxes.forEach(cb => {
            if (cb.dataset.key && state[cb.dataset.key]) {
              cb.checked = true;
            }
          });
        } catch (e) {
          console.warn('Could not parse checklist state', e);
        }
      }

      const rawSigs = localStorage.getItem(SIG_KEY);
      if (rawSigs) {
        try {
          const sigs = JSON.parse(rawSigs);
          (document.getElementById('sigDevName') as HTMLInputElement).value = sigs.devName || '';
          (document.getElementById('sigDevDate') as HTMLInputElement).value = sigs.devDate || '';
          (document.getElementById('sigClientName') as HTMLInputElement).value = sigs.clientName || '';
          (document.getElementById('sigClientDate') as HTMLInputElement).value = sigs.clientDate || '';
        } catch (e) {
          console.warn('Could not parse signatures state', e);
        }
      }
      updateProgressUI();
    }
    
     allCollapsibles.forEach(el=>{
      el.addEventListener('click', ()=>{
        const target = document.getElementById(el.getAttribute('data-target') || '');
        const chev = el.querySelector('.chev');
        if(!target) return;
        if(target.style.maxHeight && target.style.maxHeight !== '0px'){
          target.style.maxHeight = '0';
          if(target.style.paddingTop) target.style.paddingTop = '0';
          if(chev) (chev as HTMLElement).style.transform = 'rotate(0deg)';
        } else {
          target.style.maxHeight = target.scrollHeight + 'px';
          target.style.paddingTop = '12px';
          if(chev) (chev as HTMLElement).style.transform = 'rotate(90deg)';
        }
      });
    });


    const exportPdfButton = document.getElementById('exportPdf');
    if (exportPdfButton) {
      exportPdfButton.addEventListener('click', async () => {
        // @ts-ignore
        if (typeof html2pdf === 'undefined') {
          alert('Biblioteca html2pdf não está carregada. Recarregue a página e tente novamente.');
          return;
        }

        // Expand all sections to ensure they are rendered in the PDF
        document.querySelectorAll('.coll-content').forEach(content => {
          const el = content as HTMLElement;
          el.style.maxHeight = el.scrollHeight + "px";
          const trigger = el.previousElementSibling;
          if(trigger) {
            const chev = trigger.querySelector('.chev');
            if(chev) (chev as HTMLElement).style.transform = 'rotate(90deg)';
          }
        });

        const btn = exportPdfButton as HTMLButtonElement;
        const prevText = btn.textContent;
        btn.textContent = 'Gerando PDF...';
        btn.disabled = true;

        await new Promise(resolve => setTimeout(resolve, 500)); // wait for animations

        saveState();

        const dev = ((document.getElementById('sigDevName') as HTMLInputElement)?.value || 'dev').replace(/\s+/g,'_');
        const client = ((document.getElementById('sigClientName') as HTMLInputElement)?.value || 'client').replace(/\s+/g,'_');
        const date = new Date().toISOString().slice(0,10);
        const filename = `UCS_Documentacao_Checklist_${dev}_${client}_${date}.pdf`;

        const element = document.getElementById('docArea');
        if (!element) {
          alert('Erro: área de documento não encontrada.');
          return;
        }
        
        const opt = {
          margin: 15,
          filename: filename,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, logging: true, scrollY: 0, scrollX: 0 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        // @ts-ignore
        html2pdf().set(opt).from(element).save().then(() => {
          btn.textContent = '✅ PDF Gerado!';
          setTimeout(() => {
            btn.textContent = prevText;
            btn.disabled = false;
          }, 2000);
        }).catch((err: any) => {
          console.error('Erro na geração do PDF:', err);
          alert('Erro ao gerar PDF: ' + (err.message || err));
          btn.disabled = false;
        });
      });
    }

    // Auto-expand all on initial load
    setTimeout(() => {
        allCollapsibles.forEach(el => {
            const target = document.getElementById(el.getAttribute('data-target') || '');
            const chev = el.querySelector('.chev');
            if (target && chev) {
                target.style.maxHeight = target.scrollHeight + "px";
                (chev as HTMLElement).style.transform = 'rotate(90deg)';
                 target.style.paddingTop = '12px';
            }
        });
    }, 200);

    checkboxes.forEach(cb => {
      cb.addEventListener('change', saveStateDebounced);
    });
    
    ['sigDevName', 'sigDevDate', 'sigClientName', 'sigClientDate'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', saveStateDebounced);
    });
    
    const dateEl = document.getElementById('dateNow');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('pt-BR');

    loadState();
    
    return () => {
      checkboxes.forEach(cb => cb.removeEventListener('change', saveStateDebounced));
    };
  }, []);

  return (
    <div className="checklist-container">
      <Head>
        <title>UCS Index Platform — Checklist de Entrega</title>
        <script src="https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js" defer></script>
      </Head>
      <main>
        <div id="docArea">
          <section className="card" aria-labelledby="summary-title">
            <div className="section-head">
              <div className="section-title">
                <div className="icon">📋</div>
                <div>
                  <h2 id="summary-title" className="text-lg font-semibold">Resumo da Entrega</h2>
                  <div className="muted">Versão: 1.0.0 • Data: <span id="dateNow">{new Date().toLocaleDateString('pt-BR')}</span></div>
                </div>
              </div>
            </div>
            <p className="muted-note">Este documento reúne a documentação técnica, checklists, diagramas e informações de deploy para a transferência completa do projeto UCS Index Platform.</p>
          </section>

          <section className="card">
            <div className="section-title">
              <div className="icon">🗺️</div>
              <div>
                <h2 className="text-lg font-semibold">Diagramas</h2>
                <div className="muted">Arquitetura, Fluxo de Dados e Infraestrutura</div>
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <h3 className="text-md font-semibold">Arquitetura Técnica</h3>
              <p className="muted-note">Visão geral dos componentes principais: Front-end (Next.js), Camada de API (Serverless), Banco de Dados (Firestore) e integrações (N8N, Google AI).</p>
              <div className="diagram" role="img" aria-label="Diagrama de arquitetura técnica" onClick={(e) => e.currentTarget.classList.toggle('zoomed')}>
                <svg viewBox="0 0 1000 360" width="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000" floodOpacity="0.12" />
                    </filter>
                    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#9fb7e8" />
                    </marker>
                  </defs>
                  <rect x="40" y="40" rx="12" ry="12" width="220" height="80" fill="#ffffff" stroke="#dfe8f6" strokeWidth="1.5" filter="url(#shadow)" />
                  <text x="150" y="70" fontSize="14" textAnchor="middle" fill="#0f172a" fontWeight="700">Front-end</text>
                  <text x="150" y="92" fontSize="12" textAnchor="middle" fill="#6b7280">Next.js (React)</text>
                  <rect x="300" y="40" rx="12" ry="12" width="220" height="80" fill="#ffffff" stroke="#dfe8f6" strokeWidth="1.5" filter="url(#shadow)" />
                  <text x="410" y="68" fontSize="14" textAnchor="middle" fill="#0f172a" fontWeight="700">API / Server</text>
                  <text x="410" y="90" fontSize="12" textAnchor="middle" fill="#6b7280">Cloud Functions / Serverless</text>
                  <rect x="560" y="40" rx="12" ry="12" width="220" height="80" fill="#ffffff" stroke="#dfe8f6" strokeWidth="1.5" filter="url(#shadow)" />
                  <text x="670" y="68" fontSize="14" textAnchor="middle" fill="#0f172a" fontWeight="700">Banco de Dados</text>
                  <text x="670" y="90" fontSize="12" textAnchor="middle" fill="#6b7280">Firebase Firestore</text>
                  <line x1="260" y1="80" x2="300" y2="80" stroke="#9fb7e8" strokeWidth="3" markerEnd="url(#arrow)" />
                  <line x1="520" y1="80" x2="560" y2="80" stroke="#9fb7e8" strokeWidth="3" markerEnd="url(#arrow)" />
                  <rect x="120" y="180" rx="10" ry="10" width="240" height="64" fill="#fff" stroke="#dfe8f6" strokeWidth="1.2" filter="url(#shadow)" />
                  <text x="240" y="205" fontSize="13" textAnchor="middle" fill="#0f172a" fontWeight="700">N8N (Automação)</text>
                  <text x="240" y="223" fontSize="12" textAnchor="middle" fill="#6b7280">Coleta de dados e workflows</text>
                  <rect x="440" y="180" rx="10" ry="10" width="240" height="64" fill="#fff" stroke="#dfe8f6" strokeWidth="1.2" filter="url(#shadow)" />
                  <text x="560" y="205" fontSize="13" textAnchor="middle" fill="#0f172a" fontWeight="700">Google AI (Genkit)</text>
                  <text x="560" y="223" fontSize="12" textAnchor="middle" fill="#6b7280">Geração de relatórios / NLP</text>
                  <line x1="240" y1="180" x2="240" y2="140" stroke="#b7d0f7" strokeWidth="2" markerEnd="url(#arrow)" />
                  <line x1="560" y1="180" x2="560" y2="140" stroke="#b7d0f7" strokeWidth="2" markerEnd="url(#arrow)" />
                  <rect x="40" y="270" rx="8" ry="8" width="780" height="64" fill="#fbfdff" stroke="#eef4ff" />
                  <text x="70" y="295" fontSize="12" fill="#6b7280">Legenda:</text>
                  <text x="140" y="295" fontSize="12" fill="#0f172a">Frontend → Server → Firestore; N8N e Google AI integram-se via API / Webhooks</text>
                </svg>
              </div>
            </div>
            <div style={{ marginTop: '18px' }}>
              <h3 className="text-md font-semibold">Fluxo de Dados</h3>
              <p className="muted-note">Ilustra como os dados fluem desde as fontes externas (N8N), são armazenados no Firestore, e consumidos pela aplicação web e pela IA.</p>
              <div className="diagram" role="img" aria-label="Fluxo de dados" onClick={(e) => e.currentTarget.classList.toggle('zoomed')}>
                <svg viewBox="0 0 1000 160" width="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <marker id="arrow2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#9fb7e8" />
                    </marker>
                  </defs>
                  <rect x="30" y="30" rx="10" ry="10" width="150" height="50" fill="#ffffff" stroke="#dfe8f6" />
                  <text x="105" y="60" fontSize="12" textAnchor="middle" fill="#0f172a" fontWeight="700">Usuário</text>
                  <rect x="210" y="25" rx="10" ry="10" width="200" height="60" fill="#ffffff" stroke="#dfe8f6" />
                  <text x="310" y="52" fontSize="12" textAnchor="middle" fill="#0f172a" fontWeight="700">Front-end / Dashboard</text>
                  <rect x="440" y="25" rx="10" ry="10" width="160" height="60" fill="#ffffff" stroke="#dfe8f6" />
                  <text x="520" y="52" fontSize="12" textAnchor="middle" fill="#0f172a" fontWeight="700">API / Functions</text>
                  <rect x="640" y="25" rx="10" ry="10" width="170" height="60" fill="#ffffff" stroke="#dfe8f6" />
                  <text x="725" y="52" fontSize="12" textAnchor="middle" fill="#0f172a" fontWeight="700">Firestore</text>
                  <line x1="180" y1="55" x2="210" y2="55" stroke="#9fb7e8" strokeWidth="3" markerEnd="url(#arrow2)" />
                  <line x1="410" y1="55" x2="440" y2="55" stroke="#9fb7e8" strokeWidth="3" markerEnd="url(#arrow2)" />
                  <line x1="600" y1="55" x2="640" y2="55" stroke="#9fb7e8" strokeWidth="3" markerEnd="url(#arrow2)" />
                  <text x="105" y="100" fontSize="11" textAnchor="middle" fill="#6b7280">Interações do usuário</text>
                  <text x="310" y="100" fontSize="11" textAnchor="middle" fill="#6b7280">Renderização + chamadas API</text>
                </svg>
              </div>
            </div>
            <div style={{ marginTop: '18px' }}>
              <h3 className="text-md font-semibold">Infraestrutura de Deploy</h3>
              <p className="muted-note">Mostra o pipeline de CI/CD do GitHub Actions e os alvos de deploy, incluindo Vercel, Hostinger/Locaweb, e a VPS para N8N.</p>
              <div className="diagram" role="img" aria-label="Infraestrutura de deploy" onClick={(e) => e.currentTarget.classList.toggle('zoomed')}>
                <svg viewBox="0 0 1000 220" width="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <marker id="arrow3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#9fb7e8" />
                    </marker>
                  </defs>
                  <rect x="40" y="30" rx="10" ry="10" width="180" height="60" fill="#fff" stroke="#dfe8f6" />
                  <text x="130" y="60" fontSize="13" textAnchor="middle" fill="#0f172a" fontWeight="700">GitHub Repo</text>
                  <rect x="260" y="30" rx="10" ry="10" width="220" height="60" fill="#fff" stroke="#dfe8f6" />
                  <text x="370" y="50" fontSize="13" textAnchor="middle" fill="#0f172a" fontWeight="700">CI/CD (GitHub Actions)</text>
                  <text x="370" y="68" fontSize="11" textAnchor="middle" fill="#6b7280">Lint, Testes, Build</text>
                  <rect x="520" y="10" rx="10" ry="10" width="200" height="40" fill="#fff" stroke="#dfe8f6" />
                  <text x="620" y="35" fontSize="12" textAnchor="middle" fill="#0f172a">Vercel (Recomendado)</text>
                  <rect x="520" y="70" rx="10" ry="10" width="200" height="40" fill="#fff" stroke="#dfe8f6" />
                  <text x="620" y="95" fontSize="12" textAnchor="middle" fill="#0f172a">Hostinger / Locaweb</text>
                  <rect x="760" y="40" rx="10" ry="10" width="180" height="60" fill="#fff" stroke="#dfe8f6" />
                  <text x="850" y="65" fontSize="12" textAnchor="middle" fill="#0f172a">VPS (N8N / Monitoramento)</text>
                  <line x1="220" y1="60" x2="260" y2="60" stroke="#9fb7e8" strokeWidth="3" markerEnd="url(#arrow3)" />
                  <line x1="480" y1="50" x2="520" y2="30" stroke="#9fb7e8" strokeWidth="3" markerEnd="url(#arrow3)" />
                  <line x1="480" y1="80" x2="520" y2="90" stroke="#9fb7e8" strokeWidth="3" markerEnd="url(#arrow3)" />
                  <line x1="720" y1="70" x2="760" y2="70" stroke="#9fb7e8" strokeWidth="3" markerEnd="url(#arrow3)" />
                </svg>
              </div>
            </div>
          </section>

          <section className="card" style={{ marginTop: '18px' }}>
            <div className="section-head">
              <div className="section-title">
                <div className="icon">✅</div>
                <h2 className="text-lg font-semibold">Checklist de Entrega</h2>
              </div>
              <div style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>Progresso: <strong id="progressPct">0%</strong></div>
            </div>
            <div style={{ marginTop: '12px' }}>

              <div className="collapsible" data-target="preEntrega">
                <div className="title"><strong>📋 Pré-Entrega</strong></div>
                <div className="chev">▸</div>
              </div>
              <div id="preEntrega" className="coll-content">
                <h3>🏗️ Desenvolvimento Concluído</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="pre_dev_func" /><span className="txt">Todas as funcionalidades implementadas conforme especificação</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_dev_tests" /><span className="txt">Testes locais realizados com sucesso</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_dev_review" /><span className="txt">Código revisado e documentado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_dev_perf" /><span className="txt">Performance otimizada</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_dev_resp" /><span className="txt">Responsividade testada em diferentes dispositivos</span></label></li>
                </ul>
                <h3>📚 Documentação Completa</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="pre_doc_readme" /><span className="txt">README.md atualizado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_doc_tech" /><span className="txt">Documentação técnica de entrega criada</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_doc_env" /><span className="txt">Arquivo de exemplo de variáveis de ambiente</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_doc_install" /><span className="txt">Instruções de instalação e deploy</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_doc_diagrams" /><span className="txt">Diagramas de arquitetura atualizados</span></label></li>
                </ul>
              </div>

              <div className="collapsible" data-target="entrega">
                <div className="title"><strong>🚀 Entrega</strong></div>
                <div className="chev">▸</div>
              </div>
              <div id="entrega" className="coll-content">
                <h3>📦 Arquivos Entregues</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="entrega_code" /><span className="txt">Código-fonte completo</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="entrega_doc" /><span className="txt">Documentação técnica (`DOCUMENTACAO_TECNICA_ENTREGA.md`)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="entrega_readme" /><span className="txt">README atualizado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="entrega_env" /><span className="txt">Arquivo de exemplo (`env.example`)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="entrega_backup" /><span className="txt">Backup do banco de dados (se solicitado)</span></label></li>
                </ul>
                <h3>🔑 Credenciais</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="cred_firebase" /><span className="txt">Firebase: Projeto criado e configurado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="cred_ai" /><span className="txt">Google AI: API Key configurada</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="cred_n8n" /><span className="txt">N8N: Instância configurada (se aplicável)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="cred_domain" /><span className="txt">Domínio: Configurado e apontando</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="cred_ssl" /><span className="txt">SSL: Certificado configurado</span></label></li>
                </ul>
              </div>

              <div className="collapsible" data-target="testes">
                <div className="title"><strong>🔍 Testes de Aceite</strong></div>
                <div className="chev">▸</div>
              </div>
              <div id="testes" className="coll-content">
                <h3>✅ Testes Funcionais</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="test_func_login" /><span className="txt">Usuário consegue fazer login</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_func_dashboard" /><span className="txt">Dashboard exibe dados em tempo real</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_func_pdf" /><span className="txt">Exportação de PDF funcionando</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_func_admin" /><span className="txt">Admin permite CRUD de usuários</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_func_audit" /><span className="txt">Sistema de auditoria registra ações</span></label></li>
                </ul>
                <h3>✅ Testes de Performance</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="test_perf_load" /><span className="txt">Carregamento inicial &lt; 3 segundos</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_perf_nav" /><span className="txt">Navegação entre páginas &lt; 1 segundo</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_perf_export" /><span className="txt">Exportação de PDF &lt; 10 segundos</span></label></li>
                </ul>
              </div>

              <div className="collapsible" data-target="seguranca">
                <div className="title"><strong>🛡️ Segurança e LGPD</strong></div>
                <div className="chev">▸</div>
              </div>
              <div id="seguranca" className="coll-content">
                <h3>🔐 Autenticação</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="sec_auth_login" /><span className="txt">Login seguro implementado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="sec_auth_roles" /><span className="txt">Controle de acesso por roles</span></label></li>
                </ul>
                <h3>🛡️ Proteção de Dados</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="sec_data_crypto" /><span className="txt">Dados sensíveis criptografados</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="sec_data_sanitize" /><span className="txt">Validação e sanitização de inputs</span></label></li>
                </ul>
                <h3>📋 Conformidade LGPD</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="lgpd_consent" /><span className="txt">Consentimento explícito implementado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="lgpd_policy" /><span className="txt">Política de privacidade atualizada</span></label></li>
                </ul>
              </div>

              <div className="collapsible" data-target="n8n">
                <div className="title"><strong>🔄 N8N - Automação</strong></div>
                <div className="chev">▸</div>
              </div>
              <div id="n8n" className="coll-content">
                <h3>🚀 Deploy do N8N</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_deploy_vps" /><span className="txt">VPS contratado (Locaweb/Hostinger)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_deploy_docker" /><span className="txt">Docker e Docker Compose instalados</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_deploy_run" /><span className="txt">N8N deployado e funcionando</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_deploy_import" /><span className="txt">Fluxo "UCS - Pronto" importado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_deploy_creds" /><span className="txt">Credenciais Firebase configuradas</span></label></li>
                </ul>
                <h3>⚙️ Configuração</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_config_cron" /><span className="txt">Cron jobs configurados (15 min)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_config_fb" /><span className="txt">Conexão Firebase testada</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_config_wh" /><span className="txt">Webhooks configurados</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_config_env" /><span className="txt">Variáveis de ambiente definidas</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_config_ssl" /><span className="txt">SSL configurado (HTTPS)</span></label></li>
                </ul>
                <h3>🔍 Testes</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_test_manual" /><span className="txt">Execução manual testada</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_test_save" /><span className="txt">Dados sendo salvos no Firebase</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_test_auto" /><span className="txt">Execução automática funcionando</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_test_error" /><span className="txt">Tratamento de erros funcionando</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_test_logs" /><span className="txt">Logs sendo gerados corretamente</span></label></li>
                </ul>
                <h3>📊 Monitoramento</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_mon_uptime" /><span className="txt">Monitoramento de uptime configurado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_mon_alerts" /><span className="txt">Alertas por email configurados</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_mon_logs" /><span className="txt">Sistema de logs funcionando</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_mon_backup" /><span className="txt">Backup automático configurado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="n8n_mon_restart" /><span className="txt">Restart automático em caso de crash</span></label></li>
                </ul>
              </div>

              <div className="collapsible" data-target="suporte">
                <div className="title"><strong>📞 Suporte Pós-Entrega</strong></div>
                <div className="chev">▸</div>
              </div>
              <div id="suporte" className="coll-content">
                <h3>🆘 Suporte Imediato</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="sup_imm_email" /><span className="txt">Suporte via email configurado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="sup_imm_sla" /><span className="txt">SLA de resposta definido (24h)</span></label></li>
                </ul>
                <h3>📈 Suporte Contínuo</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="sup_cont_contract" /><span className="txt">Contrato de suporte definido</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="sup_cont_backup" /><span className="txt">Backup de rotina configurado</span></label></li>
                </ul>
              </div>

              <div style={{ marginTop: '14px' }}>
                <h3>✅ Assinaturas</h3>
                <p className="muted-note">Preencha os campos abaixo antes de exportar o PDF.</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1', minWidth: '220px' }}>
                    <div style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>Desenvolvedor</div>
                    <input id="sigDevName" className="sig-input" placeholder="Nome do desenvolvedor" />
                  </div>
                  <div style={{ minWidth: '200px' }}>
                    <div style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>Data</div>
                    <input id="sigDevDate" className="sig-input" placeholder="DD/MM/AAAA" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1', minWidth: '220px' }}>
                    <div style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>Cliente</div>
                    <input id="sigClientName" className="sig-input" placeholder="Nome do cliente" />
                  </div>
                  <div style={{ minWidth: '200px' }}>
                    <div style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>Data</div>
                    <input id="sigClientDate" className="sig-input" placeholder="DD/MM/AAAA" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <aside>
        <div className="sticky">
          <div className="card">
            <div className="panel-title">📊 Progresso</div>
            <div style={{ textAlign: 'center', margin: '16px 0' }}>
              <div id="progressBig">0%</div>
              <div style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))', marginTop: '8px' }}>
                <span id="completedItems">0</span> de <span id="totalItems">0</span> itens concluídos
              </div>
              <div style={{ marginTop: '12px' }}>
                <div className="progress-bar-container" style={{ width: '100%', height: '8px' }}>
                  <div className="progress-bar-fill" id="progressFillSidebar" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="panel-title">⚡ Ações Rápidas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Button id="exportPdf" size="sm">Exportar PDF</Button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

    