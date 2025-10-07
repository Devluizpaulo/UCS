
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
            if (cb.dataset.key && state[cb.dataset.key] !== undefined) {
               cb.checked = Boolean(state[cb.dataset.key]);
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
    
     allCollapsibles.forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const targetId = el.getAttribute('data-target');
        const target = targetId ? document.getElementById(targetId) : null;
        const chev = el.querySelector('.chev');
        
        if (!target) {
          console.warn('Target não encontrado para:', targetId);
          return;
        }
        
        const isExpanded = target.style.maxHeight && target.style.maxHeight !== '0px';
        
        if (isExpanded) {
          // Recolher
          target.style.maxHeight = '0px';
          target.style.paddingTop = '0px';
          if (chev) (chev as HTMLElement).style.transform = 'rotate(0deg)';
        } else {
          // Expandir
          target.style.maxHeight = target.scrollHeight + 'px';
          target.style.paddingTop = '12px';
          if (chev) (chev as HTMLElement).style.transform = 'rotate(90deg)';
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
        <style jsx>{`
          .collapsible {
            cursor: pointer;
            user-select: none;
            transition: background-color 0.2s ease;
          }
          .collapsible:hover {
            background-color: rgba(0, 0, 0, 0.05);
          }
          .coll-content {
            overflow: hidden;
            transition: max-height 0.3s ease, padding-top 0.3s ease;
            max-height: 0;
            padding-top: 0;
          }
          .chev {
            transition: transform 0.3s ease;
            font-size: 14px;
            color: #6b7280;
          }
          .card {
            padding: 32px !important;
            margin-bottom: 24px;
            max-width: none !important;
            width: 100% !important;
          }
          .section-head {
            margin-bottom: 24px;
          }
          .section-title {
            margin-bottom: 20px;
          }
          .checklist-container {
            max-width: 1400px !important;
            margin: 0 auto;
            padding: 0 16px;
          }
          main {
            max-width: none !important;
            width: 100% !important;
          }
          #docArea {
            max-width: none !important;
            width: 100% !important;
          }
          .diagram svg {
            max-width: 100%;
            height: auto;
          }
        `}</style>
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

          {/* VISÃO GERAL DO PROJETO */}
          <section className="card">
            <div className="section-head">
              <div className="section-title">
                <div className="icon">🏛️</div>
                <div>
                  <h2 className="text-lg font-semibold">Visão Geral do Projeto</h2>
                  <div className="muted">Descrição, funcionalidades e tecnologias</div>
                </div>
              </div>
            </div>

          <div style={{ marginTop: '24px', padding: '0 8px' }}>
            <h3 className="text-sm font-semibold text-blue-600" style={{ marginBottom: '20px' }}>Descrição</h3>
            <p className="muted-note" style={{ marginBottom: '28px', lineHeight: '1.7', paddingRight: '12px' }}>UCS Index Platform é uma aplicação web para monitoramento de índices de sustentabilidade, commodities e ativos, com análises, relatórios em PDF/Excel e integração com automações (N8N) e IA (Google Genkit).</p>

            <h3 className="text-sm font-semibold text-blue-600" style={{ marginBottom: '20px' }}>Principais funcionalidades</h3>
            <ul className="muted-note" style={{ paddingLeft: '28px', lineHeight: '1.8', paddingRight: '12px' }}>
              <li style={{ marginBottom: '12px' }}>Dashboard executivo em tempo real</li>
              <li style={{ marginBottom: '12px' }}>Análise de composição e tendências</li>
              <li style={{ marginBottom: '12px' }}>Relatórios automatizados (PDF / Excel)</li>
              <li style={{ marginBottom: '12px' }}>Administração, auditoria e recálculos</li>
              <li style={{ marginBottom: '12px' }}>Integração com Google AI e N8N</li>
              <li style={{ marginBottom: '12px' }}>Sistema de internacionalização (i18n)</li>
              <li style={{ marginBottom: '12px' }}>Tema claro otimizado para legibilidade</li>
              <li style={{ marginBottom: '12px' }}>Exportação de dados com gráficos</li>
            </ul>
          </div>
          </section>

          {/* ESTRUTURA DE PASTAS */}
          <section className="card">
            <div className="section-head">
              <div className="section-title">
                <div className="icon">📁</div>
                <div>
                  <h2 className="text-lg font-semibold">Estrutura de Pastas & Módulos</h2>
                  <div className="muted">Resumo da organização do repositório</div>
                </div>
              </div>
            </div>

            <pre className="muted-note" style={{ 
              background: '#fbfdff', 
              padding: '24px', 
              borderRadius: '8px', 
              marginTop: '24px', 
              overflow: 'auto',
              lineHeight: '1.7',
              fontSize: '13px',
              border: '1px solid #e2e8f0',
              marginLeft: '8px',
              marginRight: '8px'
            }}>
{`UCS/
├── src/
│   ├── app/ (Next.js App Router)
│   │   ├── (main)/ (Dashboard, Admin, Settings)
│   │   ├── globals.css (Tema claro otimizado)
│   │   └── layout.tsx (Root layout)
│   ├── components/
│   │   ├── ui/ (Shadcn/ui components)
│   │   ├── excel-preview-modal.tsx
│   │   ├── excel-export-button.tsx
│   │   ├── composition-analysis.tsx
│   │   └── language-switcher.tsx
│   ├── lib/
│   │   ├── i18n.ts (Sistema de internacionalização)
│   │   ├── language-context.tsx
│   │   ├── excel-chart-generator.ts
│   │   └── firebase/ (Configurações Firebase)
│   └── hooks/
├── docs/ (Documentação técnica)
├── public/ (Assets estáticos)
├── package.json (Dependências e scripts)
└── next.config.ts (Configuração Next.js)`}
            </pre>
          </section>

          {/* DIAGRAMAS */}
          <section className="card">
            <div className="section-head">
              <div className="section-title">
                <div className="icon">🗺️</div>
                <div>
                  <h2 className="text-lg font-semibold">Diagramas</h2>
                  <div className="muted">Arquitetura, Fluxo de Dados e Infraestrutura</div>
                </div>
              </div>
            </div>

            {/* Arquitetura Técnica */}
            <div style={{ marginTop: '24px', padding: '0 8px' }}>
              <h3 className="text-sm font-semibold text-blue-600" style={{ marginBottom: '20px' }}>Arquitetura Técnica</h3>
              <div className="diagram" role="img" aria-label="Diagrama de arquitetura técnica">
                <svg viewBox="0 0 700 250" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.1"/>
                    </filter>
                  </defs>
                  <rect x="32" y="32" rx="10" ry="10" width="176" height="64" fill="#ffffff" stroke="#dfe8f6" strokeWidth="1.2" filter="url(#shadow)"/>
                  <text x="120" y="56" fontSize="11.2" textAnchor="middle" fill="#0f172a" fontWeight="700">Front-end</text>
                  <text x="120" y="73.6" fontSize="9.6" textAnchor="middle" fill="#6b7280">Next.js (React)</text>
                  <rect x="240" y="32" rx="10" ry="10" width="176" height="64" fill="#ffffff" stroke="#dfe8f6" strokeWidth="1.2" filter="url(#shadow)"/>
                  <text x="328" y="54.4" fontSize="11.2" textAnchor="middle" fill="#0f172a" fontWeight="700">API / Server</text>
                  <text x="328" y="72" fontSize="9.6" textAnchor="middle" fill="#6b7280">Cloud Functions / Serverless</text>
                  <rect x="448" y="32" rx="10" ry="10" width="176" height="64" fill="#ffffff" stroke="#dfe8f6" strokeWidth="1.2" filter="url(#shadow)"/>
                  <text x="536" y="54.4" fontSize="11.2" textAnchor="middle" fill="#0f172a" fontWeight="700">Banco de Dados</text>
                  <text x="536" y="72" fontSize="9.6" textAnchor="middle" fill="#6b7280">Firebase Firestore</text>
                  <line x1="208" y1="64" x2="240" y2="64" stroke="#9fb7e8" strokeWidth="2.4" markerEnd="url(#arrow)"/>
                  <line x1="416" y1="64" x2="448" y2="64" stroke="#9fb7e8" strokeWidth="2.4" markerEnd="url(#arrow)"/>
                  <rect x="96" y="144" rx="8" ry="8" width="192" height="51.2" fill="#fff" stroke="#dfe8f6" strokeWidth="0.96" filter="url(#shadow)"/>
                  <text x="192" y="164" fontSize="10.4" textAnchor="middle" fill="#0f172a" fontWeight="700">N8N (Automação)</text>
                  <text x="192" y="178.4" fontSize="9.6" textAnchor="middle" fill="#6b7280">Coleta de dados e workflows</text>
                  <rect x="352" y="144" rx="8" ry="8" width="192" height="51.2" fill="#fff" stroke="#dfe8f6" strokeWidth="0.96" filter="url(#shadow)"/>
                  <text x="448" y="164" fontSize="10.4" textAnchor="middle" fill="#0f172a" fontWeight="700">Google AI (Genkit)</text>
                  <text x="448" y="178.4" fontSize="9.6" textAnchor="middle" fill="#6b7280">Geração de relatórios / NLP</text>
                  <line x1="192" y1="144" x2="192" y2="112" stroke="#b7d0f7" strokeWidth="1.6" markerEnd="url(#arrow)"/>
                  <line x1="448" y1="144" x2="448" y2="112" stroke="#b7d0f7" strokeWidth="1.6" markerEnd="url(#arrow)"/>
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#9fb7e8"/>
                    </marker>
                  </defs>
                  <rect x="32" y="216" rx="6.4" ry="6.4" width="624" height="51.2" fill="#fbfdff" stroke="#eef4ff"/>
                  <text x="56" y="236" fontSize="9.6" fill="#6b7280">Legenda:</text>
                  <text x="112" y="236" fontSize="9.6" fill="#0f172a">Frontend → Server → Firestore; N8N e Google AI integram-se via API / Webhooks</text>
                </svg>
              </div>
            </div>

            {/* Fluxo de Dados */}
            <div style={{ marginTop: '32px', padding: '0 8px' }}>
              <h3 className="text-sm font-semibold text-blue-600" style={{ marginBottom: '20px' }}>Fluxo de Dados</h3>
              <div className="diagram" role="img" aria-label="Fluxo de dados">
                <svg viewBox="0 0 700 120" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <rect x="24" y="24" rx="8" ry="8" width="120" height="40" fill="#ffffff" stroke="#dfe8f6"/>
                  <text x="84" y="48" fontSize="9.6" textAnchor="middle" fill="#0f172a" fontWeight="700">Usuário</text>
                  <rect x="168" y="20" rx="8" ry="8" width="160" height="48" fill="#ffffff" stroke="#dfe8f6"/>
                  <text x="248" y="41.6" fontSize="9.6" textAnchor="middle" fill="#0f172a" fontWeight="700">Front-end / Dashboard</text>
                  <rect x="352" y="20" rx="8" ry="8" width="128" height="48" fill="#ffffff" stroke="#dfe8f6"/>
                  <text x="416" y="41.6" fontSize="9.6" textAnchor="middle" fill="#0f172a" fontWeight="700">API / Functions</text>
                  <rect x="512" y="20" rx="8" ry="8" width="136" height="48" fill="#ffffff" stroke="#dfe8f6"/>
                  <text x="580" y="41.6" fontSize="9.6" textAnchor="middle" fill="#0f172a" fontWeight="700">Firestore</text>
                  <line x1="144" y1="44" x2="168" y2="44" stroke="#9fb7e8" strokeWidth="2.4" markerEnd="url(#arrow2)"/>
                  <line x1="328" y1="44" x2="352" y2="44" stroke="#9fb7e8" strokeWidth="2.4" markerEnd="url(#arrow2)"/>
                  <line x1="480" y1="44" x2="512" y2="44" stroke="#9fb7e8" strokeWidth="2.4" markerEnd="url(#arrow2)"/>
                  <defs>
                    <marker id="arrow2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#9fb7e8"/>
                    </marker>
                  </defs>
                  <text x="84" y="80" fontSize="8.8" textAnchor="middle" fill="#6b7280">Interações do usuário</text>
                  <text x="248" y="80" fontSize="8.8" textAnchor="middle" fill="#6b7280">Renderização + chamadas API</text>
                </svg>
              </div>
            </div>

            {/* Infraestrutura de Deploy */}
            <div style={{ marginTop: '32px', padding: '0 8px' }}>
              <h3 className="text-sm font-semibold text-blue-600" style={{ marginBottom: '20px' }}>Infraestrutura de Deploy</h3>
              <div className="diagram" role="img" aria-label="Infraestrutura de deploy">
                 <svg viewBox="0 0 700 150" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <rect x="32" y="24" rx="8" ry="8" width="144" height="48" fill="#fff" stroke="#dfe8f6"/>
                  <text x="104" y="48" fontSize="10.4" textAnchor="middle" fill="#0f172a" fontWeight="700">GitHub Repo</text>
                  <rect x="208" y="24" rx="8" ry="8" width="176" height="48" fill="#fff" stroke="#dfe8f6"/>
                  <text x="296" y="40" fontSize="10.4" textAnchor="middle" fill="#0f172a" fontWeight="700">CI/CD (GitHub Actions)</text>
                  <text x="296" y="54.4" fontSize="8.8" textAnchor="middle" fill="#6b7280">Lint, Testes, Build</text>
                  <rect x="416" y="8" rx="8" ry="8" width="160" height="32" fill="#fff" stroke="#dfe8f6"/>
                  <text x="496" y="28" fontSize="9.6" textAnchor="middle" fill="#0f172a">Vercel (Recomendado)</text>
                  <rect x="416" y="56" rx="8" ry="8" width="160" height="32" fill="#fff" stroke="#dfe8f6"/>
                  <text x="496" y="76" fontSize="9.6" textAnchor="middle" fill="#0f172a">Hostinger / Locaweb</text>
                  <rect x="608" y="32" rx="8" ry="8" width="144" height="48" fill="#fff" stroke="#dfe8f6"/>
                  <text x="680" y="52" fontSize="9.6" textAnchor="middle" fill="#0f172a">VPS (N8N / Monitoramento)</text>
                  <line x1="176" y1="48" x2="208" y2="48" stroke="#9fb7e8" strokeWidth="2.4" markerEnd="url(#arrow3)"/>
                  <line x1="384" y1="40" x2="416" y2="24" stroke="#9fb7e8" strokeWidth="2.4" markerEnd="url(#arrow3)"/>
                  <line x1="384" y1="64" x2="416" y2="72" stroke="#9fb7e8" strokeWidth="2.4" markerEnd="url(#arrow3)"/>
                  <line x1="576" y1="56" x2="608" y2="56" stroke="#9fb7e8" strokeWidth="2.4" markerEnd="url(#arrow3)"/>
                  <defs>
                    <marker id="arrow3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#9fb7e8"/>
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>
          </section>

          {/* FLUXO N8N */}
          <section className="card">
            <div className="section-head">
              <div className="section-title">
                <div className="icon">🔄</div>
                <div>
                  <h2 className="text-lg font-semibold">Fluxo N8N - Automação de Coleta de Dados</h2>
                  <div className="muted">Automação para coleta de dados de commodities e índices</div>
                </div>
              </div>
            </div>

          <div style={{ marginTop: '24px', padding: '0 8px' }}>
            <h3 className="text-sm font-semibold text-blue-600" style={{ marginBottom: '20px' }}>Descrição do Fluxo</h3>
            <p className="muted-note" style={{ marginBottom: '28px', lineHeight: '1.7', paddingRight: '12px' }}>O fluxo N8N "UCS - Pronto" é responsável pela coleta automatizada de dados de commodities (Milho, Soja, Petróleo, etc.) e índices de sustentabilidade, processando e armazenando essas informações no Firebase para alimentar o dashboard da aplicação.</p>

            <h3 className="text-sm font-semibold text-blue-600" style={{ marginBottom: '20px' }}>Funcionalidades Principais</h3>
            <ul className="muted-note" style={{ paddingLeft: '28px', lineHeight: '1.8', marginBottom: '28px', paddingRight: '12px' }}>
              <li style={{ marginBottom: '12px' }}>Coleta automática de preços de commodities (Investing.com)</li>
              <li style={{ marginBottom: '12px' }}>Processamento e validação de dados numéricos</li>
              <li style={{ marginBottom: '12px' }}>Armazenamento estruturado no Firebase Firestore</li>
              <li style={{ marginBottom: '12px' }}>Tratamento de erros e logs de auditoria</li>
              <li style={{ marginBottom: '12px' }}>Execução programada (cron jobs)</li>
            </ul>

            <h3 className="text-sm font-semibold text-blue-600" style={{ marginBottom: '20px' }}>Arquitetura do Fluxo</h3>
              <div className="diagram" role="img" aria-label="Arquitetura do fluxo N8N">
                <svg viewBox="0 0 700 280" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <filter id="shadow-n8n" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.1"/>
                    </filter>
                    <marker id="arrow-n8n" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#9fb7e8"/>
                    </marker>
                  </defs>
                  <rect x="32" y="32" rx="10" ry="10" width="144" height="48" fill="#fff" stroke="#dfe8f6" strokeWidth="1.2" filter="url(#shadow-n8n)"/>
                  <text x="104" y="56" fontSize="10.4" textAnchor="middle" fill="#0f172a" fontWeight="700">⏰ Cron Trigger</text>
                  <text x="104" y="70.4" fontSize="8.8" textAnchor="middle" fill="#6b7280">Execução programada</text>
                  <rect x="208" y="32" rx="10" ry="10" width="144" height="48" fill="#fff" stroke="#dfe8f6" strokeWidth="1.2" filter="url(#shadow-n8n)"/>
                  <text x="280" y="56" fontSize="10.4" textAnchor="middle" fill="#0f172a" fontWeight="700">🌐 HTTP Request</text>
                  <text x="280" y="70.4" fontSize="8.8" textAnchor="middle" fill="#6b7280">Investing.com</text>
                  <rect x="384" y="32" rx="10" ry="10" width="144" height="48" fill="#fff" stroke="#dfe8f6" strokeWidth="1.2" filter="url(#shadow-n8n)"/>
                  <text x="456" y="56" fontSize="10.4" textAnchor="middle" fill="#0f172a" fontWeight="700">🔍 HTML Extract</text>
                  <text x="456" y="70.4" fontSize="8.8" textAnchor="middle" fill="#6b7280">CSS Selectors</text>
                  <rect x="560" y="32" rx="10" ry="10" width="144" height="48" fill="#fff" stroke="#dfe8f6" strokeWidth="1.2" filter="url(#shadow-n8n)"/>
                  <text x="632" y="56" fontSize="10.4" textAnchor="middle" fill="#0f172a" fontWeight="700">⚙️ Code</text>
                  <text x="632" y="70.4" fontSize="8.8" textAnchor="middle" fill="#6b7280">Processar Dados</text>
                  <rect x="208" y="128" rx="10" ry="10" width="144" height="48" fill="#fff" stroke="#dfe8f6" strokeWidth="1.2" filter="url(#shadow-n8n)"/>
                  <text x="280" y="152" fontSize="10.4" textAnchor="middle" fill="#0f172a" fontWeight="700">🔥 Firebase</text>
                  <text x="280" y="166.4" fontSize="8.8" textAnchor="middle" fill="#6b7280">Write Document</text>
                  <rect x="384" y="128" rx="10" ry="10" width="144" height="48" fill="#fff" stroke="#dfe8f6" strokeWidth="1.2" filter="url(#shadow-n8n)"/>
                  <text x="456" y="152" fontSize="10.4" textAnchor="middle" fill="#0f172a" fontWeight="700">⚠️ Error</text>
                  <text x="456" y="166.4" fontSize="8.8" textAnchor="middle" fill="#6b7280">Handle Errors</text>
                  <rect x="560" y="128" rx="10" ry="10" width="144" height="48" fill="#fff" stroke="#dfe8f6" strokeWidth="1.2" filter="url(#shadow-n8n)"/>
                  <text x="632" y="152" fontSize="10.4" textAnchor="middle" fill="#0f172a" fontWeight="700">📝 Log</text>
                  <text x="632" y="166.4" fontSize="8.8" textAnchor="middle" fill="#6b7280">Audit Trail</text>
                  <line x1="176" y1="56" x2="208" y2="56" stroke="#9fb7e8" strokeWidth="2.4" markerEnd="url(#arrow-n8n)"/>
                  <line x1="352" y1="56" x2="384" y2="56" stroke="#9fb7e8" strokeWidth="2.4" markerEnd="url(#arrow-n8n)"/>
                  <line x1="528" y1="56" x2="560" y2="56" stroke="#9fb7e8" strokeWidth="2.4" markerEnd="url(#arrow-n8n)"/>
                  <line x1="632" y1="80" x2="280" y2="128" stroke="#9fb7e8" strokeWidth="2.4" markerEnd="url(#arrow-n8n)"/>
                  <line x1="632" y1="80" x2="456" y2="128" stroke="#9fb7e8" strokeWidth="2.4" markerEnd="url(#arrow-n8n)"/>
                  <line x1="632" y1="80" x2="632" y2="128" stroke="#9fb7e8" strokeWidth="2.4" markerEnd="url(#arrow-n8n)"/>
                  <rect x="32" y="224" rx="8" ry="8" width="160" height="64" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8"/>
                  <text x="112" y="244" fontSize="9.6" textAnchor="middle" fill="#0f172a" fontWeight="700">📊 Fontes de Dados</text>
                  <text x="112" y="260" fontSize="8.8" textAnchor="middle" fill="#6b7280">• Milho (Investing.com)</text>
                  <text x="112" y="272" fontSize="8.8" textAnchor="middle" fill="#6b7280">• Soja, Petróleo, Ouro</text>
                  <text x="112" y="284" fontSize="8.8" textAnchor="middle" fill="#6b7280">• Índices de Sustentabilidade</text>
                  <rect x="224" y="224" rx="8" ry="8" width="160" height="64" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8"/>
                  <text x="304" y="244" fontSize="9.6" textAnchor="middle" fill="#0f172a" fontWeight="700">💾 Saída</text>
                  <text x="304" y="260" fontSize="8.8" textAnchor="middle" fill="#6b7280">• Firebase Firestore</text>
                  <text x="304" y="272" fontSize="8.8" textAnchor="middle" fill="#6b7280">• Logs de Auditoria</text>
                  <text x="304" y="284" fontSize="8.8" textAnchor="middle" fill="#6b7280">• Tratamento de Erros</text>
                  <rect x="416" y="224" rx="8" ry="8" width="160" height="64" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8"/>
                  <text x="496" y="244" fontSize="9.6" textAnchor="middle" fill="#0f172a" fontWeight="700">⏱️ Agendamento</text>
                  <text x="496" y="260" fontSize="8.8" textAnchor="middle" fill="#6b7280">• Execução a cada 15 min</text>
                  <text x="496" y="272" fontSize="8.8" textAnchor="middle" fill="#6b7280">• Horário comercial</text>
                  <text x="496" y="284" fontSize="8.8" textAnchor="middle" fill="#6b7280">• Retry automático</text>
                  <rect x="608" y="224" rx="8" ry="8" width="160" height="64" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8"/>
                  <text x="688" y="244" fontSize="9.6" textAnchor="middle" fill="#0f172a" fontWeight="700">⚡ Performance</text>
                  <text x="688" y="260" fontSize="8.8" textAnchor="middle" fill="#6b7280">• Execução &lt; 30 segundos</text>
                  <text x="688" y="272" fontSize="8.8" textAnchor="middle" fill="#6b7280">• Uptime 99.9%</text>
                  <text x="688" y="284" fontSize="8.8" textAnchor="middle" fill="#6b7280">• Monitoramento 24/7</text>
                </svg>
              </div>

            <h3 className="text-sm font-semibold text-blue-600" style={{ marginTop: '32px', marginBottom: '20px' }}>Custos de Hospedagem 24/7</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', marginTop: '24px', padding: '0 8px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>🏢 Locaweb VPS</h4>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>VPS 1 GB - Linux</div>
                  <ul style={{ margin: '8px 0', paddingLeft: '16px', fontSize: '13px', color: '#374151' }}>
                    <li>2 vCPUs</li>
                    <li>1 GB RAM</li>
                    <li>40 GB SSD</li>
                    <li>Transferência ilimitada</li>
                    <li>Ubuntu 20.04+</li>
                    <li>Painel de controle</li>
                    <li>Suporte técnico</li>
                  </ul>
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 600 }}>Mensal: R$ 31,90/mês</div>
                    <div style={{ fontSize: '13px', color: '#059669' }}>Trimestral: R$ 29,90/mês (R$ 89,70 total)</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Semestral: R$ 27,90/mês</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Anual: R$ 25,90/mês</div>
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>🌐 Hostinger VPS</h4>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>KVM 2 - 12 meses</div>
                  <ul style={{ margin: '8px 0', paddingLeft: '16px', fontSize: '13px', color: '#374151' }}>
                    <li>2 vCPUs</li>
                    <li>4 GB RAM</li>
                    <li>80 GB SSD</li>
                    <li>Transferência ilimitada</li>
                    <li>Ubuntu 20.04+</li>
                    <li>Painel de controle</li>
                    <li>Suporte técnico</li>
                  </ul>
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 600 }}>Anual: R$ 46,99/mês</div>
                    <div style={{ fontSize: '13px', color: '#059669' }}>Economia anual: R$ 516,00</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Total anual: R$ 563,88</div>
                  </div>
                </div>
              </div>
              <div style={{ background: '#fef3c7', padding: '28px', borderRadius: '10px', border: '1px solid #f59e0b', marginTop: '32px', marginLeft: '8px', marginRight: '8px' }}>
                <h4 style={{ margin: '0 0 20px 0', color: '#92400e' }}>🏆 Melhor Opção: Hostinger KVM 2</h4>
                <p style={{ margin: '0', fontSize: '14px', color: '#92400e', lineHeight: '1.7', paddingRight: '12px' }}>
                  <strong>Hostinger KVM 2</strong> é a melhor opção para execução 24/7 do N8N, oferecendo mais recursos (4GB RAM vs 1GB) por um custo similar ao trimestral da Locaweb. Ideal para múltiplos fluxos e crescimento futuro.
                </p>
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
                  <li className="check-item"><label><input type="checkbox" data-key="pre_dev_func" defaultChecked/><span className="txt">Todas as funcionalidades implementadas conforme especificação</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_dev_tests" /><span className="txt">Testes locais realizados com sucesso</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_dev_review" defaultChecked/><span className="txt">Código revisado e documentado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_dev_perf" /><span className="txt">Performance otimizada</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_dev_resp" defaultChecked/><span className="txt">Responsividade testada em diferentes dispositivos</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_dev_lint" defaultChecked/><span className="txt">Linting e formatação de código aplicados</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_dev_types" defaultChecked/><span className="txt">TypeScript configurado e sem erros</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_dev_build" defaultChecked/><span className="txt">Build de produção funcionando</span></label></li>
                </ul>
                <h3>📚 Documentação Completa</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="pre_doc_readme" defaultChecked/><span className="txt">README.md atualizado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_doc_tech" defaultChecked/><span className="txt">Documentação técnica de entrega criada</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_doc_env" defaultChecked/><span className="txt">Arquivo de exemplo de variáveis de ambiente</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_doc_install" defaultChecked/><span className="txt">Instruções de instalação e deploy</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_doc_diagrams" defaultChecked/><span className="txt">Diagramas de arquitetura atualizados</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_doc_api" /><span className="txt">Documentação da API (se aplicável)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_doc_changelog" /><span className="txt">CHANGELOG.md atualizado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_doc_license" /><span className="txt">LICENSE.md definido</span></label></li>
                </ul>
                <h3>🔧 Configuração de Ambiente</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="pre_env_node" defaultChecked/><span className="txt">Node.js versão compatível especificada</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_env_pnpm" /><span className="txt">pnpm configurado como gerenciador de pacotes</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_env_deps" defaultChecked/><span className="txt">Dependências atualizadas e sem vulnerabilidades</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="pre_env_scripts" defaultChecked/><span className="txt">Scripts de desenvolvimento e produção configurados</span></label></li>
                </ul>
              </div>

              <div className="collapsible" data-target="entrega">
                <div className="title"><strong>🚀 Entrega</strong></div>
                <div className="chev">▸</div>
              </div>
              <div id="entrega" className="coll-content">
                <h3>📦 Arquivos Entregues</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="entrega_code" defaultChecked/><span className="txt">Código-fonte completo</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="entrega_doc" defaultChecked/><span className="txt">Documentação técnica (`DOCUMENTACAO_TECNICA_ENTREGA.md`)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="entrega_readme" defaultChecked/><span className="txt">README atualizado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="entrega_env" /><span className="txt">Arquivo de exemplo (`env.example`)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="entrega_backup" /><span className="txt">Backup do banco de dados (se solicitado)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="entrega_package" defaultChecked/><span className="txt">package.json com scripts configurados</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="entrega_config" defaultChecked/><span className="txt">Arquivos de configuração (next.config.js, tailwind.config.js)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="entrega_assets" defaultChecked/><span className="txt">Assets estáticos (imagens, ícones, favicons)</span></label></li>
                </ul>
                <h3>🔑 Credenciais</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="cred_firebase" /><span className="txt">Firebase: Projeto criado e configurado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="cred_ai" /><span className="txt">Google AI: API Key configurada</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="cred_n8n" /><span className="txt">N8N: Instância configurada (se aplicável)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="cred_domain" /><span className="txt">Domínio: Configurado e apontando</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="cred_ssl" /><span className="txt">SSL: Certificado configurado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="cred_deploy" /><span className="txt">Plataforma de deploy configurada (Vercel/Netlify)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="cred_monitoring" /><span className="txt">Ferramentas de monitoramento configuradas</span></label></li>
                </ul>
                <h3>🌐 Deploy e Hospedagem</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="deploy_env" /><span className="txt">Variáveis de ambiente configuradas</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="deploy_build" /><span className="txt">Build de produção funcionando</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="deploy_domain" /><span className="txt">Domínio apontando para produção</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="deploy_ssl" /><span className="txt">HTTPS configurado e funcionando</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="deploy_cdn" /><span className="txt">CDN configurado (se aplicável)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="deploy_backup" /><span className="txt">Sistema de backup configurado</span></label></li>
                </ul>
              </div>

              <div className="collapsible" data-target="testes">
                <div className="title"><strong>🔍 Testes de Aceite</strong></div>
                <div className="chev">▸</div>
              </div>
              <div id="testes" className="coll-content">
                <h3>✅ Testes Funcionais</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="test_func_login" defaultChecked/><span className="txt">Usuário consegue fazer login</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_func_dashboard" defaultChecked/><span className="txt">Dashboard exibe dados em tempo real</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_func_pdf" defaultChecked/><span className="txt">Exportação de PDF funcionando</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_func_admin" defaultChecked/><span className="txt">Admin permite CRUD de usuários</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_func_audit" defaultChecked/><span className="txt">Sistema de auditoria registra ações</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_func_excel" defaultChecked/><span className="txt">Exportação de Excel funcionando</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_func_charts" defaultChecked/><span className="txt">Gráficos sendo exibidos corretamente</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_func_responsive" defaultChecked/><span className="txt">Interface responsiva em todos os dispositivos</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_func_i18n" defaultChecked/><span className="txt">Sistema de internacionalização funcionando</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_func_theme" defaultChecked/><span className="txt">Sistema de temas funcionando</span></label></li>
                </ul>
                <h3>✅ Testes de Performance</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="test_perf_load" /><span className="txt">Carregamento inicial &lt; 3 segundos</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_perf_nav" /><span className="txt">Navegação entre páginas &lt; 1 segundo</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_perf_export" /><span className="txt">Exportação de PDF &lt; 10 segundos</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_perf_memory" /><span className="txt">Uso de memória otimizado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_perf_bundle" /><span className="txt">Bundle size otimizado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_perf_lighthouse" /><span className="txt">Lighthouse score &gt; 90</span></label></li>
                </ul>
                <h3>✅ Testes de Compatibilidade</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="test_comp_chrome" defaultChecked/><span className="txt">Chrome (últimas 2 versões)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_comp_firefox" /><span className="txt">Firefox (últimas 2 versões)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_comp_safari" /><span className="txt">Safari (últimas 2 versões)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_comp_edge" /><span className="txt">Edge (últimas 2 versões)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_comp_mobile" defaultChecked/><span className="txt">Dispositivos móveis (iOS/Android)</span></label></li>
                </ul>
                <h3>✅ Testes de Segurança</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="test_sec_auth" defaultChecked/><span className="txt">Autenticação segura funcionando</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_sec_roles" defaultChecked/><span className="txt">Controle de acesso por roles</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_sec_input" defaultChecked/><span className="txt">Validação de inputs</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_sec_xss" defaultChecked/><span className="txt">Proteção contra XSS</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="test_sec_csrf" defaultChecked/><span className="txt">Proteção contra CSRF</span></label></li>
                </ul>
              </div>

              <div className="collapsible" data-target="seguranca">
                <div className="title"><strong>🛡️ Segurança e LGPD</strong></div>
                <div className="chev">▸</div>
              </div>
              <div id="seguranca" className="coll-content">
                <h3>🔐 Autenticação e Autorização</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="sec_auth_login" defaultChecked/><span className="txt">Login seguro implementado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="sec_auth_roles" defaultChecked/><span className="txt">Controle de acesso por roles</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="sec_auth_session" defaultChecked/><span className="txt">Gerenciamento de sessão seguro</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="sec_auth_logout" defaultChecked/><span className="txt">Logout seguro implementado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="sec_auth_2fa" /><span className="txt">2FA implementado (se aplicável)</span></label></li>
                </ul>
                <h3>🛡️ Proteção de Dados</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="sec_data_crypto" /><span className="txt">Dados sensíveis criptografados</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="sec_data_sanitize" /><span className="txt">Validação e sanitização de inputs</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="sec_data_transport" defaultChecked/><span className="txt">Dados transmitidos via HTTPS</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="sec_data_storage" defaultChecked/><span className="txt">Armazenamento seguro configurado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="sec_data_backup" /><span className="txt">Backup seguro dos dados</span></label></li>
                </ul>
                <h3>🔒 Segurança da Aplicação</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="sec_app_headers" /><span className="txt">Headers de segurança configurados</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="sec_app_cors" /><span className="txt">CORS configurado corretamente</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="sec_app_rate" /><span className="txt">Rate limiting implementado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="sec_app_env" defaultChecked/><span className="txt">Variáveis de ambiente protegidas</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="sec_app_logs" /><span className="txt">Logs de segurança configurados</span></label></li>
                </ul>
                <h3>📋 Conformidade LGPD</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="lgpd_consent" defaultChecked/><span className="txt">Consentimento explícito implementado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="lgpd_policy" defaultChecked/><span className="txt">Política de privacidade atualizada</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="lgpd_cookies" defaultChecked/><span className="txt">Banner de cookies implementado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="lgpd_data" /><span className="txt">Direitos do titular implementados</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="lgpd_audit" defaultChecked/><span className="txt">Auditoria de dados implementada</span></label></li>
                </ul>
              </div>

              <div className="collapsible" data-target="monitoramento">
                <div className="title"><strong>📊 Monitoramento e Observabilidade</strong></div>
                <div className="chev">▸</div>
              </div>
              <div id="monitoramento" className="coll-content">
                <h3>📈 Métricas de Performance</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="mon_perf_uptime" /><span className="txt">Monitoramento de uptime configurado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="mon_perf_response" /><span className="txt">Tempo de resposta monitorado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="mon_perf_errors" /><span className="txt">Taxa de erro monitorada</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="mon_perf_throughput" /><span className="txt">Throughput monitorado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="mon_perf_resources" /><span className="txt">Uso de recursos monitorado</span></label></li>
                </ul>
                <h3>🔍 Logs e Rastreamento</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="mon_logs_centralized" /><span className="txt">Logs centralizados configurados</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="mon_logs_structured" /><span className="txt">Logs estruturados implementados</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="mon_logs_retention" /><span className="txt">Política de retenção de logs definida</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="mon_logs_search" /><span className="txt">Sistema de busca de logs configurado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="mon_logs_alerts" /><span className="txt">Alertas baseados em logs configurados</span></label></li>
                </ul>
                <h3>🚨 Alertas e Notificações</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="mon_alerts_email" /><span className="txt">Alertas por email configurados</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="mon_alerts_slack" /><span className="txt">Alertas no Slack configurados (se aplicável)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="mon_alerts_thresholds" /><span className="txt">Thresholds de alerta definidos</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="mon_alerts_escalation" /><span className="txt">Política de escalação definida</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="mon_alerts_test" /><span className="txt">Alertas testados e funcionando</span></label></li>
                </ul>
                <h3>📊 Dashboards e Relatórios</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="mon_dash_main" /><span className="txt">Dashboard principal configurado</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="mon_dash_business" /><span className="txt">Métricas de negócio configuradas</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="mon_dash_technical" /><span className="txt">Métricas técnicas configuradas</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="mon_dash_reports" /><span className="txt">Relatórios automáticos configurados</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="mon_dash_access" /><span className="txt">Controle de acesso aos dashboards</span></label></li>
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
              
              <div className="collapsible" data-target="hospedagem">
                <div className="title"><strong>🏢 Seção de Hospedagem</strong></div>
                <div className="chev">▸</div>
              </div>
              <div id="hospedagem" className="coll-content">
                  <h3>💰 Custos de Hospedagem 24/7</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginTop: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>🏢 Locaweb VPS</h4>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>VPS 1 GB - Linux</div>
                      <ul style={{ margin: '8px 0', paddingLeft: '16px', fontSize: '13px', color: '#374151' }}>
                        <li>2 vCPUs</li>
                        <li>1 GB RAM</li>
                        <li>40 GB SSD</li>
                        <li>Transferência ilimitada</li>
                        <li>Ubuntu 20.04+</li>
                        <li>Painel de controle</li>
                        <li>Suporte técnico</li>
                      </ul>
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 600 }}>Mensal: R$ 31,90/mês</div>
                        <div style={{ fontSize: '13px', color: '#059669' }}>Trimestral: R$ 29,90/mês (R$ 89,70 total)</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Semestral: R$ 27,90/mês</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Anual: R$ 25,90/mês</div>
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>🌐 Hostinger VPS</h4>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>KVM 2 - 12 meses</div>
                      <ul style={{ margin: '8px 0', paddingLeft: '16px', fontSize: '13px', color: '#374151' }}>
                        <li>2 vCPUs</li>
                        <li>4 GB RAM</li>
                        <li>80 GB SSD</li>
                        <li>Transferência ilimitada</li>
                        <li>Ubuntu 20.04+</li>
                        <li>Painel de controle</li>
                        <li>Suporte técnico</li>
                      </ul>
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 600 }}>Anual: R$ 46,99/mês</div>
                        <div style={{ fontSize: '13px', color: '#059669' }}>Economia anual: R$ 516,00</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Total anual: R$ 563,88</div>
                      </div>
                    </div>
                  </div>
                  <h3 style={{ marginTop: '18px' }}>🎯 Recomendação de Custo</h3>
                   <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '10px', border: '1px solid #f59e0b', marginTop: '12px' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#92400e' }}>🏆 Melhor Opção: Hostinger KVM 2</h4>
                      <p style={{ margin: '0', fontSize: '14px', color: '#92400e' }}>
                        <strong>Hostinger KVM 2</strong> é a melhor opção para execução 24/7 do N8N, oferecendo mais recursos (4GB RAM vs 1GB) por um custo similar ao trimestral da Locaweb. Ideal para múltiplos fluxos e crescimento futuro.
                      </p>
                  </div>

                  <h3>🔧 Configurações Necessárias</h3>
                  <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="hosp_vps" /><span className="txt">VPS contratado e ativo</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="hosp_ssh" /><span className="txt">Acesso SSH configurado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="hosp_firewall" /><span className="txt">Firewall configurado (portas 22, 80, 443)</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="hosp_docker" /><span className="txt">Docker e N8N instalados</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="hosp_firebase" /><span className="txt">Projeto Firebase e Service Account configurados</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="hosp_monitoring" /><span className="txt">Logs centralizados e alertas</span></label></li>
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
