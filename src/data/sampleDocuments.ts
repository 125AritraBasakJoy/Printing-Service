import { PrintJob, PrintSettings } from '../types/print';

export interface SampleDocTemplate {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'document';
  description: string;
  size: number;
  pageCount: number;
  mimeType: string;
  defaultSettings: Partial<PrintSettings>;
  pages: {
    pageNumber: number;
    title: string;
    htmlContent: string;
  }[];
}

export const SAMPLE_DOCUMENTS: SampleDocTemplate[] = [
  {
    id: 'sample-resume',
    name: 'Joy_Basak_Software_Engineer_CV.pdf',
    type: 'pdf',
    description: '2-Page Professional Software Engineer Resume (Color / A4 Duplex)',
    size: 245000,
    pageCount: 2,
    mimeType: 'application/pdf',
    defaultSettings: {
      colorMode: 'color',
      copies: 2,
      paperSize: 'A4',
      duplex: 'double_long',
      finishing: {
        staple: 'top_left',
        binding: 'none',
        lamination: false,
        paperWeight: 'heavy_100gsm',
      },
      notes: 'Please print on 100gsm bright white paper. Single staple on top-left.',
    },
    pages: [
      {
        pageNumber: 1,
        title: 'Curriculum Vitae - Page 1',
        htmlContent: `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 32px; color: #1e293b; background: white; max-width: 680px; margin: 0 auto; line-height: 1.5;">
            <div style="border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
              <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; letter-spacing: -0.5px;">JOY BASAK</h1>
              <p style="font-size: 13px; font-weight: 700; color: #4338ca; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">Senior Full-Stack Software Engineer</p>
              <div style="font-size: 11.5px; color: #64748b; display: flex; gap: 12px; flex-wrap: wrap;">
                <span>basakjoy125@gmail.com</span> · <span>+880 1712-345678</span> · <span>Dhaka, Bangladesh</span> · <span>github.com/joybasak</span>
              </div>
            </div>
            
            <div style="margin-bottom: 18px;">
              <h2 style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; border-left: 3px solid #4338ca; padding-left: 8px; margin-bottom: 8px;">Professional Summary</h2>
              <p style="font-size: 12px; color: #334155; margin: 0; text-align: justify; line-height: 1.6;">
                Senior Software Engineer with 6+ years of specialized experience architecting scalable distributed systems, high-throughput backend microservices (Node.js/TypeScript/Go), and responsive cloud web interfaces. Proven expertise deploying secure real-time workflows and low-latency infrastructure.
              </p>
            </div>

            <div style="margin-bottom: 18px;">
              <h2 style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; border-left: 3px solid #4338ca; padding-left: 8px; margin-bottom: 10px;">Technical Experience</h2>
              
              <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                  <strong style="font-size: 12.5px; color: #0f172a;">Lead Backend Engineer · BrainStation 23</strong>
                  <span style="font-size: 11px; color: #64748b; font-family: monospace;">2022 – Present</span>
                </div>
                <div style="font-size: 11px; color: #4338ca; margin-bottom: 4px;">FinTech Core Banking & Real-Time Settlement Architecture</div>
                <ul style="font-size: 11.5px; color: #334155; margin: 0; padding-left: 16px; line-height: 1.5;">
                  <li>Architected event-driven transaction ledger handling 4.2M daily events with 99.99% uptime.</li>
                  <li>Reduced API p99 latency from 340ms to 42ms through Redis caching and PostgreSQL query optimization.</li>
                  <li>Spearheaded secure OAuth 2.0 and hardware token integration for mobile banking applications.</li>
                </ul>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                  <strong style="font-size: 12.5px; color: #0f172a;">Software Engineer · TigerIT Bangladesh</strong>
                  <span style="font-size: 11px; color: #64748b; font-family: monospace;">2019 – 2022</span>
                </div>
                <div style="font-size: 11px; color: #4338ca; margin-bottom: 4px;">Biometric Verification & Smart Identity Platforms</div>
                <ul style="font-size: 11.5px; color: #334155; margin: 0; padding-left: 16px; line-height: 1.5;">
                  <li>Developed high-speed citizen verification services supporting national biometric identity databases.</li>
                  <li>Maintained strict cryptographic security standards (AES-256, SHA-256, PKI infrastructure).</li>
                </ul>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div>
                <h2 style="font-size: 11.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Languages & Frameworks</h2>
                <div style="font-size: 11px; color: #475569; line-height: 1.5;">
                  TypeScript, Node.js, Go, Python, React, Next.js, Express, Tailwind CSS, GraphQL
                </div>
              </div>
              <div>
                <h2 style="font-size: 11.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Cloud & Databases</h2>
                <div style="font-size: 11px; color: #475569; line-height: 1.5;">
                  PostgreSQL, Redis, MongoDB, Docker, Kubernetes, AWS (ECS, S3, RDS), GCP Cloud Run
                </div>
              </div>
            </div>
          </div>
        `,
      },
      {
        pageNumber: 2,
        title: 'Curriculum Vitae - Page 2',
        htmlContent: `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 32px; color: #1e293b; background: white; max-width: 680px; margin: 0 auto; line-height: 1.5;">
            <div style="margin-bottom: 20px;">
              <h2 style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; border-left: 3px solid #4338ca; padding-left: 8px; margin-bottom: 10px;">Selected Engineering Projects</h2>
              
              <div style="margin-bottom: 12px; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="font-weight: 700; font-size: 12px; color: #0f172a; margin-bottom: 2px;">PrintBridge - Private Printing Service Protocol</div>
                <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">Zero-trust document forwarding bridge for physical print shops in Bangladesh with auto-wipe on print spool.</div>
                <div style="font-size: 10.5px; color: #059669; font-weight: 600;">Stack: React, Vite, Express, Web Crypto API, Tailored Print Media CSS</div>
              </div>

              <div style="background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="font-weight: 700; font-size: 12px; color: #0f172a; margin-bottom: 2px;">Dhaka Rapid Transit Pulse</div>
                <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">Real-time subway transit telemetry display system serving 80,000+ daily commuters.</div>
                <div style="font-size: 10.5px; color: #059669; font-weight: 600;">Result: Open-source project awarded Best Civic Tech Solution 2024.</div>
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <h2 style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; border-left: 3px solid #4338ca; padding-left: 8px; margin-bottom: 10px;">Education & Credentials</h2>
              <div style="margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between;">
                  <strong style="font-size: 12px; color: #0f172a;">B.Sc. in Computer Science and Engineering</strong>
                  <span style="font-size: 11px; color: #64748b; font-family: monospace;">2015 – 2019</span>
                </div>
                <div style="font-size: 11px; color: #475569;">Bangladesh University of Engineering and Technology (BUET) · First Class Honours</div>
              </div>
            </div>

            <div>
              <h2 style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; border-left: 3px solid #4338ca; padding-left: 8px; margin-bottom: 8px;">Awards & Hackathons</h2>
              <ul style="font-size: 11px; color: #334155; margin: 0; padding-left: 16px; line-height: 1.6;">
                <li>Champion, National Hackathon on Frontier Technology (Dhaka, 2023)</li>
                <li>Finalist, ACM-ICPC Dhaka Regional Contest (2018)</li>
              </ul>
            </div>
          </div>
        `,
      },
    ],
  },
  {
    id: 'sample-nid',
    name: 'National_Smart_ID_Card_Official.png',
    type: 'image',
    description: 'National Smart NID Card (High-Resolution Color Card Print / Cut Ready)',
    size: 290000,
    pageCount: 1,
    mimeType: 'image/png',
    defaultSettings: {
      colorMode: 'color',
      copies: 1,
      paperSize: '4x6_Photo',
      duplex: 'single',
      finishing: {
        staple: 'none',
        binding: 'none',
        lamination: true,
        paperWeight: 'glossy_photo',
      },
      notes: 'Print in high resolution on glossy photo paper. Both front and back on same sheet for lamination.',
    },
    pages: [
      {
        pageNumber: 1,
        title: 'National Smart ID Card (Front & Back)',
        htmlContent: `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; padding: 24px; max-width: 600px; margin: 0 auto; border: 2px dashed #94a3b8; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 16px;">
              <span style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px;">
                Official Identity Verification · Government of the People's Republic of Bangladesh
              </span>
            </div>

            <!-- Front Side -->
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 40%, #0f766e 100%); color: white; padding: 18px; border-radius: 10px; margin-bottom: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); position: relative;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(255,255,255,0.25); padding-bottom: 8px; margin-bottom: 12px;">
                <div>
                  <div style="font-size: 9px; letter-spacing: 1px; opacity: 0.9;">PEOPLE'S REPUBLIC OF BANGLADESH</div>
                  <div style="font-size: 13px; font-weight: 800;">NATIONAL SMART IDENTITY CARD</div>
                </div>
                <div style="background: #dc2626; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">
                  BD
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 80px 1fr; gap: 14px; align-items: center;">
                <div style="width: 80px; height: 95px; background: #e2e8f0; border-radius: 6px; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #475569;">
                  👤
                </div>
                <div style="font-size: 11px; space-y: 2px;">
                  <div><span style="opacity: 0.75; font-size: 9.5px;">NAME:</span> <strong style="font-size: 12px;">JOY BASAK</strong></div>
                  <div><span style="opacity: 0.75; font-size: 9.5px;">FATHER'S NAME:</span> <strong>ANIL BASAK</strong></div>
                  <div><span style="opacity: 0.75; font-size: 9.5px;">MOTHER'S NAME:</span> <strong>MAYA BASAK</strong></div>
                  <div><span style="opacity: 0.75; font-size: 9.5px;">DATE OF BIRTH:</span> <strong style="font-family: monospace;">15 AUG 1996</strong></div>
                  <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.2);">
                    <span style="opacity: 0.75; font-size: 9.5px;">NID NO:</span> <strong style="font-family: monospace; font-size: 13px; letter-spacing: 1px; color: #fef08a;">7318 9402 1928</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Back Side -->
            <div style="background: #ffffff; color: #0f172a; padding: 16px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 10.5px;">
              <div style="margin-bottom: 8px;">
                <span style="color: #64748b; font-size: 9px; text-transform: uppercase;">Permanent Address:</span>
                <div style="font-weight: 600; color: #334155; margin-top: 1px;">
                  House #42, Road #12, Dhanmondi, Dhaka-1209, Bangladesh
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 8px;">
                <div><span style="color: #64748b;">Blood Group:</span> <strong style="color: #dc2626;">B+ (Positive)</strong></div>
                <div><span style="color: #64748b;">Issue Date:</span> <strong style="font-family: monospace;">12/03/2018</strong></div>
              </div>
              <div style="margin-top: 10px; background: #f1f5f9; padding: 6px; border-radius: 4px; font-family: monospace; font-size: 11px; letter-spacing: 2px; text-align: center; color: #475569;">
                IDBGD7318940219&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;9608154M2812318BGD
              </div>
            </div>
          </div>
        `,
      },
    ],
  },
  {
    id: 'sample-invoice',
    name: 'Official_Tax_Invoice_#INV-9042.pdf',
    type: 'pdf',
    description: 'Commercial GST/Tax Invoice with Itemized Table & Stamp',
    size: 182000,
    pageCount: 1,
    mimeType: 'application/pdf',
    defaultSettings: {
      colorMode: 'bw',
      copies: 3,
      paperSize: 'A4',
      duplex: 'single',
      finishing: {
        staple: 'none',
        binding: 'none',
        lamination: false,
        paperWeight: 'standard_75gsm',
      },
      notes: 'Need 3 copies for Accounts, Vendor copy, and Logistics gate pass.',
    },
    pages: [
      {
        pageNumber: 1,
        title: 'Commercial Tax Invoice',
        htmlContent: `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 28px; color: #0f172a; background: white; max-width: 680px; margin: 0 auto; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 16px;">
              <div>
                <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">NEXUS LOGISTICS & TECH LTD</h1>
                <p style="margin: 0; color: #475569; font-size: 11px;">Gulshan Avenue, Dhaka 1212, Bangladesh</p>
                <p style="margin: 0; color: #475569; font-size: 11px;">BIN / VAT ID: 002918349-0102</p>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 20px; font-weight: 800; color: #4338ca;">TAX INVOICE</div>
                <div style="font-weight: 700; font-family: monospace; font-size: 13px; color: #0f172a;">INV-2026-9042</div>
                <div style="color: #64748b; font-size: 11px;">Date: Sept 23, 2026</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; background: #f8fafc; padding: 12px; border-radius: 6px;">
              <div>
                <strong style="color: #64748b; font-size: 10px; text-transform: uppercase;">Billed To:</strong>
                <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">Apex Engineering Solutions Inc.</div>
                <div style="color: #475569; font-size: 11px;">Attn: Procurement Department</div>
                <div style="color: #475569; font-size: 11px;">108 Innovation Boulevard</div>
              </div>
              <div>
                <strong style="color: #64748b; font-size: 10px; text-transform: uppercase;">Dispatch Details:</strong>
                <div style="color: #475569; font-size: 11px; margin-top: 2px;">P.O. Number: <strong>PO-2026-4410</strong></div>
                <div style="color: #475569; font-size: 11px;">Waybill: WB-994827103</div>
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11.5px;">
              <thead>
                <tr style="background: #0f172a; color: white; text-align: left;">
                  <th style="padding: 8px; border: 1px solid #0f172a;">#</th>
                  <th style="padding: 8px; border: 1px solid #0f172a;">Item & Description</th>
                  <th style="padding: 8px; border: 1px solid #0f172a; text-align: center;">Qty</th>
                  <th style="padding: 8px; border: 1px solid #0f172a; text-align: right;">Unit (৳)</th>
                  <th style="padding: 8px; border: 1px solid #0f172a; text-align: right;">Total (৳)</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">1</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Industrial Optical Sensor Modules</strong></td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 600;">10</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">৳1,200.00</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: 600;">৳12,000.00</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">2</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Shielded Field Cables (10m)</strong></td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 600;">20</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">৳350.00</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: 600;">৳7,000.00</td>
                </tr>
              </tbody>
            </table>

            <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
              <div style="width: 240px; font-size: 11.5px;">
                <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569;">
                  <span>Subtotal:</span>
                  <span style="font-family: monospace;">৳19,000.00</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569;">
                  <span>VAT (5%):</span>
                  <span style="font-family: monospace;">৳950.00</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #0f172a; font-weight: 800; font-size: 14px; color: #0f172a;">
                  <span>Total Amount:</span>
                  <span style="font-family: monospace; color: #4338ca;">৳19,950.00</span>
                </div>
              </div>
            </div>
          </div>
        `,
      },
    ],
  },
];
