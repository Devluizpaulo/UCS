
'use client';

import { useEffect } from 'react';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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


    const resetButton = document.getElementById('resetChecklist');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja resetar o checklist? Todos os dados marcados serão perdidos.')) {
          // Limpar todos os checkboxes
          checkboxes.forEach(cb => {
            cb.checked = false;
          });
          
          // Limpar campos de assinatura
          (document.getElementById('sigDevName') as HTMLInputElement).value = '';
          (document.getElementById('sigDevDate') as HTMLInputElement).value = '';
          (document.getElementById('sigClientName') as HTMLInputElement).value = '';
          (document.getElementById('sigClientDate') as HTMLInputElement).value = '';
          
          // Limpar localStorage
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(SIG_KEY);
          
          // Atualizar UI
          updateProgressUI();
          
          alert('✅ Checklist resetado com sucesso!');
        }
      });
    }

    const exportPdfButton = document.getElementById('exportPdf');
    if (exportPdfButton) {
        exportPdfButton.addEventListener('click', async () => {
            const btn = exportPdfButton as HTMLButtonElement;
            const prevText = btn.textContent;
            btn.textContent = 'Gerando PDF...';
            btn.disabled = true;

            const element = document.getElementById('docArea') as HTMLElement;
            if (!element) {
                alert('Erro: área de documento não encontrada.');
                btn.disabled = false;
                btn.textContent = prevText;
                return;
            }
            
            // Expand all sections for capture
            document.querySelectorAll('.coll-content').forEach(content => {
                const el = content as HTMLElement;
                el.style.maxHeight = el.scrollHeight + "px";
            });
            await new Promise(r => setTimeout(r, 300)); // wait for expansion

            html2canvas(element, {
                scale: 1.5, // Aumenta a resolução da captura
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/jpeg', 0.98);
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4',
                });
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                
                // Calcula a proporção para caber na largura do PDF
                const ratio = (pdfWidth - 20) / canvasWidth; // margem de 10mm de cada lado
                const imgHeight = canvasHeight * ratio;
                const imgWidth = canvasWidth * ratio;
                
                let heightLeft = imgHeight;
                let position = 0;
                
                const margin = 10;

                // Adiciona a primeira página
                pdf.addImage(imgData, 'JPEG', margin, position + margin, imgWidth, imgHeight);
                heightLeft -= (pdfHeight - margin * 2);

                // Adiciona páginas subsequentes se necessário
                while (heightLeft > 0) {
                    position -= (pdfHeight - margin * 2);
                    pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', margin, position + margin, imgWidth, imgHeight);
                    heightLeft -= (pdfHeight - margin * 2);
                }
                
                const dev = ((document.getElementById('sigDevName') as HTMLInputElement)?.value || 'dev').replace(/\s+/g,'_');
                const client = ((document.getElementById('sigClientName') as HTMLInputElement)?.value || 'client').replace(/\s+/g,'_');
                const date = new Date().toISOString().slice(0,10);
                const filename = `UCS_Documentacao_Checklist_${dev}_${client}_${date}.pdf`;

                pdf.save(filename);
                
                btn.textContent = '✅ PDF Gerado!';
                setTimeout(() => {
                    btn.textContent = prevText;
                    btn.disabled = false;
                }, 2000);
            }).catch(err => {
                console.error('Erro na geração do PDF:', err);
                alert('Erro ao gerar PDF: ' + (err.message || err));
                btn.disabled = false;
                btn.textContent = prevText;
            });
             // Collapse sections back
            document.querySelectorAll('.coll-content').forEach(content => {
                const el = content as HTMLElement;
                el.style.maxHeight = '0px';
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
            max-width: 900px !important; /* largura ideal para PDF sem corte */
            width: 100% !important;
            margin: 0 auto;
            background: #ffffff;
          }
          .diagram {
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 16px auto;
            max-width: 450px;
          }
          .diagram svg {
            max-width: 100%;
            width: 100% !important;
            height: auto !important;
          }
          @media print {
            html, body {
              background: #ffffff !important;
            }
            #docArea {
              width: 100%;
              max-width: 100%;
              margin: 0;
              padding: 0;
            }
            .card {
              page-break-inside: avoid;
            }
            .diagram {
              max-width: 450px;
              page-break-inside: avoid;
              margin: 12px auto;
            }
            .diagram svg {
              max-width: 100%;
              width: 100% !important;
              height: auto !important;
            }
            h3 {
              page-break-after: avoid;
            }
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
                <svg viewBox="0 0 300 420" width="300" height="420" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <marker id="arrowhead" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#a0aec0"/>
                    </marker>
                    <filter id="svg_shadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.1"/>
                    </filter>
                  </defs>

                  <g filter="url(#svg_shadow)">
                    <rect x="25" y="25" width="250" height="50" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1"/>
                    <rect x="25" y="95" width="250" height="50" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1"/>
                    <rect x="25" y="165" width="250" height="50" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1"/>
                    <rect x="25" y="235" width="250" height="50" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1"/>
                    <rect x="25" y="305" width="250" height="50" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1"/>
                  </g>

                  <text x="40" y="45" fontSize="10" fill="#2d3748" fontWeight="bold">🌐 Frontend (Next.js)</text>
                  <text x="40" y="60" fontSize="8" fill="#718096">Interface do Usuário / Vercel</text>

                  <text x="40" y="115" fontSize="10" fill="#2d3748" fontWeight="bold">⚙️ API / Server (Cloud Functions)</text>
                  <text x="40" y="130" fontSize="8" fill="#718096">Lógica de negócio e endpoints</text>
                  
                  <text x="40" y="185" fontSize="10" fill="#2d3748" fontWeight="bold">🔥 Banco de Dados (Firestore)</text>
                  <text x="40" y="200" fontSize="8" fill="#718096">Armazenamento de dados NoSQL</text>

                  <text x="40" y="255" fontSize="10" fill="#2d3748" fontWeight="bold">🤖 IA (Google AI / Genkit)</text>
                  <text x="40" y="270" fontSize="8" fill="#718096">Geração de relatórios e análises</text>

                  <text x="40" y="325" fontSize="10" fill="#2d3748" fontWeight="bold">🔄 Automação (N8N)</text>
                  <text x="40" y="340" fontSize="8" fill="#718096">Coleta de dados de mercado</text>

                  <path d="M 150 75 V 95" stroke="#a0aec0" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
                  <path d="M 150 145 V 165" stroke="#a0aec0" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
                  <path d="M 150 215 V 235" stroke="#a0aec0" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
                  <path d="M 150 285 V 305" stroke="#a0aec0" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
                </svg>
              </div>
            </div>

            {/* Fluxo de Dados */}
            <div style={{ marginTop: '32px', padding: '0 8px' }}>
              <h3 className="text-sm font-semibold text-blue-600" style={{ marginBottom: '20px' }}>Fluxo de Dados</h3>
              <div className="diagram" role="img" aria-label="Fluxo de dados">
                <svg viewBox="0 0 300 350" width="300" height="350" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#svg_shadow)">
                        <rect x="25" y="25" width="250" height="50" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1"/>
                        <rect x="25" y="95" width="250" height="50" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1"/>
                        <rect x="25" y="165" width="250" height="50" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1"/>
                        <rect x="25" y="235" width="250" height="50" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1"/>
                    </g>
                    
                    <text x="40" y="45" fontSize="10" fill="#2d3748" fontWeight="bold">👤 Usuário</text>
                    <text x="40" y="60" fontSize="8" fill="#718096">Interação com a plataforma</text>
                    
                    <text x="40" y="115" fontSize="10" fill="#2d3748" fontWeight="bold">🖥️ Frontend (Dashboard)</text>
                    <text x="40" y="130" fontSize="8" fill="#718096">Renderiza dados e chama API</text>
                    
                    <text x="40" y="185" fontSize="10" fill="#2d3748" fontWeight="bold">⚙️ API / Functions</text>
                    <text x="40" y="200" fontSize="8" fill="#718096">Processa requisições</text>
                    
                    <text x="40" y="255" fontSize="10" fill="#2d3748" fontWeight="bold">🔥 Firestore</text>
                    <text x="40" y="270" fontSize="8" fill="#718096">Armazena e fornece dados</text>

                    <path d="M 150 75 V 95" stroke="#a0aec0" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
                    <path d="M 150 145 V 165" stroke="#a0aec0" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
                    <path d="M 150 215 V 235" stroke="#a0aec0" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
                </svg>
              </div>
            </div>

            {/* Infraestrutura de Deploy */}
            <div style={{ marginTop: '32px', padding: '0 8px' }}>
              <h3 className="text-sm font-semibold text-blue-600" style={{ marginBottom: '20px' }}>Infraestrutura de Deploy</h3>
              <div className="diagram" role="img" aria-label="Infraestrutura de deploy">
                 <svg viewBox="0 0 300 350" width="300" height="350" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#svg_shadow)">
                        <rect x="25" y="25" width="250" height="50" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1"/>
                        <rect x="25" y="95" width="250" height="50" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1"/>
                        <rect x="25" y="165" width="250" height="50" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1"/>
                        <rect x="25" y="235" width="250" height="50" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1"/>
                    </g>
                    
                    <text x="40" y="45" fontSize="10" fill="#2d3748" fontWeight="bold">📦 GitHub Repo</text>
                    <text x="40" y="60" fontSize="8" fill="#718096">Código-fonte</text>
                    
                    <text x="40" y="115" fontSize="10" fill="#2d3748" fontWeight="bold">🤖 CI/CD (GitHub Actions)</text>
                    <text x="40" y="130" fontSize="8" fill="#718096">Lint, Testes, Build</text>
                    
                    <text x="40" y="185" fontSize="10" fill="#2d3748" fontWeight="bold">🚀 Deploy Targets</text>
                    <text x="40" y="200" fontSize="8" fill="#718096">Vercel (Recomendado)</text>
                    
                    <text x="40" y="255" fontSize="10" fill="#2d3748" fontWeight="bold">🖥️ VPS (N8N)</text>
                    <text x="40" y="270" fontSize="8" fill="#718096">Hospedagem da automação</text>
                    
                    <path d="M 150 75 V 95" stroke="#a0aec0" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
                    <path d="M 150 145 V 165" stroke="#a0aec0" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
                    <path d="M 150 215 V 235" stroke="#a0aec0" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
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
           
            <h3 className="text-sm font-semibold text-blue-600" style={{ marginBottom: '20px' }}>Arquitetura do Fluxo (SVG Detalhado)</h3>
             <div className="diagram" role="img" aria-label="Arquitetura do fluxo N8N">
                <svg viewBox="0 0 350 450" width="350" height="450" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#svg_shadow)">
                        <rect x="50" y="25" width="250" height="50" rx="8" fill="#fff" stroke="#e2e8f0"/>
                        <rect x="50" y="95" width="250" height="50" rx="8" fill="#fff" stroke="#e2e8f0"/>
                        <rect x="50" y="165" width="250" height="50" rx="8" fill="#fff" stroke="#e2e8f0"/>
                        <rect x="50" y="235" width="250" height="50" rx="8" fill="#fff" stroke="#e2e8f0"/>
                        <rect x="50" y="305" width="250" height="50" rx="8" fill="#fff" stroke="#e2e8f0"/>
                        <rect x="185" y="375" width="115" height="40" rx="8" fill="#fff" stroke="#e2e8f0"/>
                        <rect x="50" y="375" width="115" height="40" rx="8" fill="#fff" stroke="#e2e8f0"/>
                    </g>
                    
                    <text x="65" y="45" fontSize="10" fill="#2d3748" fontWeight="bold">⏰ Cron Trigger</text>
                    <text x="65" y="60" fontSize="8" fill="#718096">Execução programada</text>

                    <text x="65" y="115" fontSize="10" fill="#2d3748" fontWeight="bold">🌐 HTTP Request</text>
                    <text x="65" y="130" fontSize="8" fill="#718096">Busca dados (Investing.com)</text>

                    <text x="65" y="185" fontSize="10" fill="#2d3748" fontWeight="bold">🔍 HTML Extract</text>
                    <text x="65" y="200" fontSize="8" fill="#718096">Extrai dados com CSS Selectors</text>

                    <text x="65" y="255" fontSize="10" fill="#2d3748" fontWeight="bold">⚙️ Code</text>
                    <text x="65" y="270" fontSize="8" fill="#718096">Processa e valida os dados</text>

                    <text x="65" y="325" fontSize="10" fill="#2d3748" fontWeight="bold">🔥 Firebase</text>
                    <text x="65" y="340" fontSize="8" fill="#718096">Salva documento no Firestore</text>
                    
                    <text x="200" y="395" fontSize="9" fill="#2d3748" fontWeight="bold">⚠️ Handle Errors</text>
                    <text x="65" y="395" fontSize="9" fill="#2d3748" fontWeight="bold">📝 Log Audit</text>

                    <path d="M 175 75 V 95" stroke="#a0aec0" strokeWidth="1.5" markerEnd="url(#arrowhead)" fill="none"/>
                    <path d="M 175 145 V 165" stroke="#a0aec0" strokeWidth="1.5" markerEnd="url(#arrowhead)" fill="none"/>
                    <path d="M 175 215 V 235" stroke="#a0aec0" strokeWidth="1.5" markerEnd="url(#arrowhead)" fill="none"/>
                    <path d="M 175 285 V 305" stroke="#a0aec0" strokeWidth="1.5" markerEnd="url(#arrowhead)" fill="none"/>
                    <path d="M 175 355 C 175 365, 115 365, 115 375" stroke="#a0aec0" strokeWidth="1.5" markerEnd="url(#arrowhead)" fill="none"/>
                    <path d="M 175 355 C 175 365, 235 365, 235 375" stroke="#a0aec0" strokeWidth="1.5" markerEnd="url(#arrowhead)" fill="none"/>
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
                    <li className="check-item"><label><input type="checkbox" data-key="cred_n8n" /><span className="txt">N8N: Instância configurar dentro da conta BMV</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="cred_domain" /><span className="txt">Domínio: Configurar quando for adquirido</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="cred_ssl" /><span className="txt">SSL: Configurar quando for adquirido</span></label></li>
                    <li className="check-item"><label><input type="checkbox" data-key="cred_deploy" /><span className="txt">Plataforma de deploy configurada ou hospedar na localweb (ESTE SITE) (Vercel/Netlify)</span></label></li>
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
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>VPS 4 GB - Linux</div>
                      <ul style={{ margin: '8px 0', paddingLeft: '16px', fontSize: '13px', color: '#374151' }}>
                        <li>2 vCPUs</li>
                        <li>4 GB RAM</li>
                        <li>70 GB SSD</li>
                        <li>Transferência ilimitada</li>
                        <li>Ubuntu 20.04+</li>
                        <li>Painel de controle</li>
                      </ul>
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 600 }}>Trimestral: R$ 69,90/mês</div>
                        <div style={{ fontSize: '13px', color: '#059669' }}>Total por trimestre: R$ 209,70</div>
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
              <Button id="exportPdf" size="sm">📄 Exportar PDF</Button>
              <Button id="resetChecklist" size="sm" variant="outline">🔄 Resetar Checklist</Button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
