
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
            width: 100% !important;
            max-width: 800px;
            height: auto;
            margin: 0 auto;
            display: block;
          }
        `}</style>
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
                <svg viewBox="0 0 600 220" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style={{maxWidth: '600px'}}>
                  <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.1"/>
                    </filter>
                  </defs>
                  <rect x="25" y="25" rx="10" ry="10" width="150" height="55" fill="#ffffff" stroke="#dfe8f6" strokeWidth="1.2" filter="url(#shadow)"/>
                  <text x="100" y="48" fontSize="10" textAnchor="middle" fill="#0f172a" fontWeight="700">Front-end</text>
                  <text x="100" y="64" fontSize="8" textAnchor="middle" fill="#6b7280">Next.js (React)</text>
                  
                  <rect x="225" y="25" rx="10" ry="10" width="150" height="55" fill="#ffffff" stroke="#dfe8f6" strokeWidth="1.2" filter="url(#shadow)"/>
                  <text x="300" y="48" fontSize="10" textAnchor="middle" fill="#0f172a" fontWeight="700">API / Server</text>
                  <text x="300" y="64" fontSize="8" textAnchor="middle" fill="#6b7280">Cloud Functions</text>
                  
                  <rect x="425" y="25" rx="10" ry="10" width="150" height="55" fill="#ffffff" stroke="#dfe8f6" strokeWidth="1.2" filter="url(#shadow)"/>
                  <text x="500" y="48" fontSize="10" textAnchor="middle" fill="#0f172a" fontWeight="700">Banco de Dados</text>
                  <text x="500" y="64" fontSize="8" textAnchor="middle" fill="#6b7280">Firebase Firestore</text>
                  
                  <line x1="175" y1="52.5" x2="225" y2="52.5" stroke="#9fb7e8" strokeWidth="2" markerEnd="url(#arrow)"/>
                  <line x1="375" y1="52.5" x2="425" y2="52.5" stroke="#9fb7e8" strokeWidth="2" markerEnd="url(#arrow)"/>
                  
                  <rect x="80" y="125" rx="8" ry="8" width="160" height="45" fill="#fff" stroke="#dfe8f6" strokeWidth="1" filter="url(#shadow)"/>
                  <text x="160" y="145" fontSize="9" textAnchor="middle" fill="#0f172a" fontWeight="700">N8N (Automação)</text>
                  <text x="160" y="158" fontSize="8" textAnchor="middle" fill="#6b7280">Coleta de dados</text>
                  
                  <rect x="360" y="125" rx="8" ry="8" width="160" height="45" fill="#fff" stroke="#dfe8f6" strokeWidth="1" filter="url(#shadow)"/>
                  <text x="440" y="145" fontSize="9" textAnchor="middle" fill="#0f172a" fontWeight="700">Google AI (Genkit)</text>
                  <text x="440" y="158" fontSize="8" textAnchor="middle" fill="#6b7280">Geração de relatórios</text>
                  
                  <line x1="160" y1="125" x2="160" y2="80" stroke="#b7d0f7" strokeWidth="1.5" markerEnd="url(#arrow)"/>
                  <line x1="440" y1="125" x2="440" y2="80" stroke="#b7d0f7" strokeWidth="1.5" markerEnd="url(#arrow)"/>
                  
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#9fb7e8"/>
                    </marker>
                  </defs>
                  
                  <rect x="25" y="190" rx="6" ry="6" width="550" height="30" fill="#fbfdff" stroke="#eef4ff"/>
                  <text x="45" y="210" fontSize="8" fill="#6b7280">Legenda:</text>
                  <text x="90" y="210" fontSize="8" fill="#0f172a">Fluxo principal de dados e integrações de serviços.</text>
                </svg>
              </div>
            </div>

            {/* Fluxo de Dados */}
            <div style={{ marginTop: '32px', padding: '0 8px' }}>
              <h3 className="text-sm font-semibold text-blue-600" style={{ marginBottom: '20px' }}>Fluxo de Dados</h3>
              <div className="diagram" role="img" aria-label="Fluxo de dados">
                <svg viewBox="0 0 600 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style={{maxWidth: '550px'}}>
                  <rect x="20" y="20" rx="8" ry="8" width="100" height="35" fill="#ffffff" stroke="#dfe8f6"/>
                  <text x="70" y="42" fontSize="8" textAnchor="middle" fill="#0f172a" fontWeight="700">Usuário</text>
                  <rect x="140" y="18" rx="8" ry="8" width="130" height="40" fill="#ffffff" stroke="#dfe8f6"/>
                  <text x="205" y="38" fontSize="8" textAnchor="middle" fill="#0f172a" fontWeight="700">Front-end</text>
                  <text x="205" y="50" fontSize="7" textAnchor="middle" fill="#6b7280">Dashboard</text>
                  <rect x="290" y="18" rx="8" ry="8" width="110" height="40" fill="#ffffff" stroke="#dfe8f6"/>
                  <text x="345" y="38" fontSize="8" textAnchor="middle" fill="#0f172a" fontWeight="700">API / Functions</text>
                   <text x="345" y="50" fontSize="7" textAnchor="middle" fill="#6b7280">Processamento</text>
                  <rect x="420" y="18" rx="8" ry="8" width="110" height="40" fill="#ffffff" stroke="#dfe8f6"/>
                  <text x="475" y="38" fontSize="8" textAnchor="middle" fill="#0f172a" fontWeight="700">Firestore</text>
                  <text x="475" y="50" fontSize="7" textAnchor="middle" fill="#6b7280">Armazenamento</text>
                  <line x1="120" y1="38" x2="140" y2="38" stroke="#9fb7e8" strokeWidth="2" markerEnd="url(#arrow2)"/>
                  <line x1="270" y1="38" x2="290" y2="38" stroke="#9fb7e8" strokeWidth="2" markerEnd="url(#arrow2)"/>
                  <line x1="400" y1="38" x2="420" y2="38" stroke="#9fb7e8" strokeWidth="2" markerEnd="url(#arrow2)"/>
                  <defs>
                    <marker id="arrow2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#9fb7e8"/>
                    </marker>
                  </defs>
                  <text x="70" y="75" fontSize="7" textAnchor="middle" fill="#6b7280">Interações</text>
                  <text x="205" y="75" fontSize="7" textAnchor="middle" fill="#6b7280">Renderização + API</text>
                </svg>
              </div>
            </div>

            {/* Infraestrutura de Deploy */}
            <div style={{ marginTop: '32px', padding: '0 8px' }}>
              <h3 className="text-sm font-semibold text-blue-600" style={{ marginBottom: '20px' }}>Infraestrutura de Deploy</h3>
              <div className="diagram" role="img" aria-label="Infraestrutura de deploy">
                 <svg viewBox="0 0 600 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style={{maxWidth: '600px'}}>
                  <rect x="25" y="20" rx="8" ry="8" width="120" height="40" fill="#fff" stroke="#dfe8f6"/>
                  <text x="85" y="42" fontSize="9" textAnchor="middle" fill="#0f172a" fontWeight="700">GitHub Repo</text>
                  <rect x="170" y="20" rx="8" ry="8" width="140" height="40" fill="#fff" stroke="#dfe8f6"/>
                  <text x="240" y="38" fontSize="9" textAnchor="middle" fill="#0f172a" fontWeight="700">CI/CD (Actions)</text>
                  <text x="240" y="50" fontSize="7" textAnchor="middle" fill="#6b7280">Lint, Testes, Build</text>
                  <rect x="335" y="8" rx="8" ry="8" width="120" height="28" fill="#fff" stroke="#dfe8f6"/>
                  <text x="395" y="25" fontSize="8" textAnchor="middle" fill="#0f172a">Vercel (Recomendado)</text>
                  <rect x="335" y="46" rx="8" ry="8" width="120" height="28" fill="#fff" stroke="#dfe8f6"/>
                  <text x="395" y="63" fontSize="8" textAnchor="middle" fill="#0f172a">Hostinger / Locaweb</text>
                  <rect x="480" y="20" rx="8" ry="8" width="100" height="40" fill="#fff" stroke="#dfe8f6"/>
                  <text x="530" y="42" fontSize="8" textAnchor="middle" fill="#0f172a">VPS (N8N)</text>
                  <line x1="145" y1="40" x2="170" y2="40" stroke="#9fb7e8" strokeWidth="2" markerEnd="url(#arrow3)"/>
                  <line x1="310" y1="34" x2="335" y2="22" stroke="#9fb7e8" strokeWidth="2" markerEnd="url(#arrow3)"/>
                  <line x1="310" y1="52" x2="335" y2="60" stroke="#9fb7e8" strokeWidth="2" markerEnd="url(#arrow3)"/>
                  <line x1="455" y1="40" x2="480" y2="40" stroke="#9fb7e8" strokeWidth="2" markerEnd="url(#arrow3)"/>
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
                <svg viewBox="0 0 620 250" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style={{maxWidth: '620px'}}>
                  <defs>
                    <filter id="shadow-n8n" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="1" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.08"/>
                    </filter>
                    <marker id="arrow-n8n" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#a0aec0"/>
                    </marker>
                  </defs>
                  
                  {/* Nodes */}
                  <g>
                    <rect x="25" y="25" rx="10" ry="10" width="130" height="45" fill="#fff" stroke="#e2e8f0" filter="url(#shadow-n8n)"/>
                    <text x="90" y="48" fontSize="10" textAnchor="middle" fill="#2d3748" fontWeight="600">⏰ Cron Trigger</text>
                    <text x="90" y="62" fontSize="8" textAnchor="middle" fill="#718096">Execução programada</text>
                  </g>

                  <g>
                    <rect x="180" y="25" rx="10" ry="10" width="130" height="45" fill="#fff" stroke="#e2e8f0" filter="url(#shadow-n8n)"/>
                    <text x="245" y="48" fontSize="10" textAnchor="middle" fill="#2d3748" fontWeight="600">🌐 HTTP Request</text>
                    <text x="245" y="62" fontSize="8" textAnchor="middle" fill="#718096">Investing.com</text>
                  </g>

                  <g>
                    <rect x="335" y="25" rx="10" ry="10" width="130" height="45" fill="#fff" stroke="#e2e8f0" filter="url(#shadow-n8n)"/>
                    <text x="400" y="48" fontSize="10" textAnchor="middle" fill="#2d3748" fontWeight="600">🔍 HTML Extract</text>
                    <text x="400" y="62" fontSize="8" textAnchor="middle" fill="#718096">CSS Selectors</text>
                  </g>
                  
                  <g>
                    <rect x="490" y="25" rx="10" ry="10" width="130" height="45" fill="#fff" stroke="#e2e8f0" filter="url(#shadow-n8n)"/>
                    <text x="555" y="48" fontSize="10" textAnchor="middle" fill="#2d3748" fontWeight="600">⚙️ Code</text>
                    <text x="555" y="62" fontSize="8" textAnchor="middle" fill="#718096">Processar Dados</text>
                  </g>
                  
                  <g>
                    <rect x="260" y="115" rx="10" ry="10" width="130" height="45" fill="#fff" stroke="#e2e8f0" filter="url(#shadow-n8n)"/>
                    <text x="325" y="138" fontSize="10" textAnchor="middle" fill="#2d3748" fontWeight="600">🔥 Firebase</text>
                    <text x="325" y="152" fontSize="8" textAnchor="middle" fill="#718096">Write Document</text>
                  </g>
                  
                  <g>
                    <rect x="420" y="115" rx="10" ry="10" width="130" height="45" fill="#fff" stroke="#e2e8f0" filter="url(#shadow-n8n)"/>
                    <text x="485" y="138" fontSize="10" textAnchor="middle" fill="#2d3748" fontWeight="600">⚠️ Error</text>
                    <text x="485" y="152" fontSize="8" textAnchor="middle" fill="#718096">Handle Errors</text>
                  </g>

                  <g>
                    <rect x="95" y="115" rx="10" ry="10" width="130" height="45" fill="#fff" stroke="#e2e8f0" filter="url(#shadow-n8n)"/>
                    <text x="160" y="138" fontSize="10" textAnchor="middle" fill="#2d3748" fontWeight="600">📝 Log</text>
                    <text x="160" y="152" fontSize="8" textAnchor="middle" fill="#718096">Audit Trail</text>
                  </g>
                  
                  {/* Arrows */}
                  <line x1="155" y1="47.5" x2="180" y2="47.5" stroke="#a0aec0" strokeWidth="1.5" markerEnd="url(#arrow-n8n)"/>
                  <line x1="310" y1="47.5" x2="335" y2="47.5" stroke="#a0aec0" strokeWidth="1.5" markerEnd="url(#arrow-n8n)"/>
                  <line x1="465" y1="47.5" x2="490" y2="47.5" stroke="#a0aec0" strokeWidth="1.5" markerEnd="url(#arrow-n8n)"/>

                  <path d="M 555 70 Q 555 90 325 115" stroke="#a0aec0" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-n8n)"/>
                  <path d="M 325 70 Q 325 90 160 115" stroke="#a0aec0" strokeDasharray="4 2" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-n8n)"/>
                  <path d="M 325 70 Q 325 90 485 115" stroke="#a0aec0" strokeDasharray="4 2" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-n8n)"/>
                  
                  {/* Info boxes */}
                  <rect x="25" y="190" rx="8" ry="8" width="130" height="50" fill="#f7fafc" stroke="#e2e8f0" />
                  <text x="90" y="208" fontSize="9" textAnchor="middle" fill="#2d3748" fontWeight="600">📊 Fontes de Dados</text>
                  <text x="90" y="222" fontSize="7" textAnchor="middle" fill="#718096">• Milho, Soja, Ouro</text>
                  <text x="90" y="232" fontSize="7" textAnchor="middle" fill="#718096">• Índices Sustentáveis</text>
                  
                  <rect x="180" y="190" rx="8" ry="8" width="130" height="50" fill="#f7fafc" stroke="#e2e8f0" />
                  <text x="245" y="208" fontSize="9" textAnchor="middle" fill="#2d3748" fontWeight="600">💾 Saída</text>
                  <text x="245" y="222" fontSize="7" textAnchor="middle" fill="#718096">• Firebase Firestore</text>
                  <text x="245" y="232" fontSize="7" textAnchor="middle" fill="#718096">• Logs de Auditoria</text>

                  <rect x="335" y="190" rx="8" ry="8" width="130" height="50" fill="#f7fafc" stroke="#e2e8f0" />
                  <text x="400" y="208" fontSize="9" textAnchor="middle" fill="#2d3748" fontWeight="600">⏱️ Agendamento</text>
                  <text x="400" y="222" fontSize="7" textAnchor="middle" fill="#718096">• Execução a cada 15 min</text>
                  <text x="400" y="232" fontSize="7" textAnchor="middle" fill="#718096">• Retry automático</text>

                  <rect x="490" y="190" rx="8" ry="8" width="130" height="50" fill="#f7fafc" stroke="#e2e8f0" />
                  <text x="555" y="208" fontSize="9" textAnchor="middle" fill="#2d3748" fontWeight="600">⚡ Performance</text>
                  <text x="555" y="222" fontSize="7" textAnchor="middle" fill="#718096">• Execução &lt; 30s</text>
                  <text x="555" y="232" fontSize="7" textAnchor="middle" fill="#718096">• Monitoramento 24/7</text>
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
                  <li className="check-item"><label><input type="checkbox" data-key="entrega_env" defaultChecked/><span className="txt">Arquivo de exemplo (`env.example`)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="entrega_package" defaultChecked/><span className="txt">package.json com scripts configurados</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="entrega_config" defaultChecked/><span className="txt">Arquivos de configuração (next.config.js, tailwind.config.js)</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="entrega_assets" defaultChecked/><span className="txt">Assets estáticos (imagens, ícones, favicons)</span></label></li>
                </ul>
                <h3>🔑 Credenciais</h3>
                <ul className="checklist-list">
                  <li className="check-item"><label><input type="checkbox" data-key="cred_firebase" /><span className="txt">Firebase: Projeto criar e configurar novo projeto dentro do workspace da BMV</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="cred_ai" /><span className="txt">Google AI: API Key configurada na conta BMV</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="cred_n8n" /><span className="txt">N8N: Instância configurar dentro da conts BMV</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="cred_domain" /><span className="txt">Domínio: Configurar quando for adiquirido</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="cred_ssl" /><span className="txt">SSL: Configurar quando for adiquirido</span></label></li>
                  <li className="check-item"><label><input type="checkbox" data-key="cred_deploy" /><span className="txt">Plataforma de deploy configurada ou hspedar na localweb (ESTE SITE (Vercel/Netlify)</span></label></li>
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

              <div className="collapsible" data-target="treinamento">
                <div className="title"><strong>🎓 Treinamento</strong></div>
                <div className="chev">▸</div>
              </div>
              <div id="treinamento" className="coll-content">
                <h3>👥 Usuários Finais</h3>
                <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="train_user_manual" /><span className="txt">Manual do usuário criado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="train_user_training" /><span className="txt">Treinamento básico realizado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="train_user_faq" /><span className="txt">FAQ criado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="train_user_support" /><span className="txt">Suporte configurado</span></label></li>
                </ul>

                <h3>🔧 Administradores</h3>
                <ul className="checklist-list">
                    <li className="check-item"><label><input type="checkbox" data-key="train_admin_manual" /><span className="txt">Manual administrativo criado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="train_admin_training" /><span className="txt">Treinamento técnico realizado</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="train_admin_procedures" /><span className="txt">Procedimentos de manutenção documentados</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="train_admin_contacts" /><span className="txt">Contatos de suporte definidos</span></label></li>
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
