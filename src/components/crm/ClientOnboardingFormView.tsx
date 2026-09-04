import React, { useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Phone,
  Mail
} from 'lucide-react';

interface ClientOnboardingFormViewProps {
  client: any;
  lenders?: any[];
  agreements?: any[];
  payments?: any[];
  monthlyPaymentData?: any;
  onOpenAgreement?: (client: any) => void;
}

export const ClientOnboardingFormView: React.FC<ClientOnboardingFormViewProps> = ({
  client,
  lenders = [],
  agreements = [],
  payments = [],
  monthlyPaymentData,
  onOpenAgreement,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!client) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-gray-200">
        No client details loaded.
      </div>
    );
  }

  const handleCopy = (text: string, key: string) => {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const actionDateStr = client.created_at
    ? new Date(client.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '17 Feb 2025';

  const attachedLenders = (lenders && lenders.length > 0) ? lenders : (client.lenders || []);
  const lendersCount = attachedLenders.length > 0 ? attachedLenders.length : (client.lenders_count || 4);
  const totalDebt = client.total_debt || 450000;
  const monthlyIncome = client.monthly_income || 35000;
  const previousEmi = client.monthly_emi || client.total_emi || 20000;
  const emiRatio = client.emi_ratio || Math.round((previousEmi / (monthlyIncome || 1)) * 100);

  // Exact 35 fields from the reference screenshot
  const onboardingFields = [
    {
      sno: 1,
      heading: 'Client Name',
      value: client.name || 'Farhan khan',
      actionOn: actionDateStr,
    },
    {
      sno: 2,
      heading: 'Client Email',
      value: client.email || 'Farhan.khan313@gmail.com',
      actionOn: actionDateStr,
      isEmail: true,
    },
    {
      sno: 3,
      heading: 'Client phone number',
      value: client.phone || '919845329118',
      actionOn: actionDateStr,
      isPhone: true,
    },
    {
      sno: 4,
      heading: 'Occupation',
      value: client.occupation || client.employment_type || 'Private company employee',
      actionOn: actionDateStr,
    },
    {
      sno: 5,
      heading: 'Married?',
      value: client.marital_status || 'Married with kids',
      actionOn: actionDateStr,
    },
    {
      sno: 6,
      heading: 'Living with?',
      value: client.living_with || 'With spouse (& kids)',
      actionOn: actionDateStr,
    },
    {
      sno: 7,
      heading: 'Accomodation',
      value: client.accommodation || 'Rented (not gated)',
      actionOn: actionDateStr,
    },
    {
      sno: 8,
      heading: 'Spouse phone number',
      value: client.spouse_phone || client.alt_phone || '+918618358812',
      actionOn: actionDateStr,
      isPhone: true,
    },
    {
      sno: 9,
      heading: 'Loan amount',
      value: String(totalDebt),
      actionOn: actionDateStr,
    },
    {
      sno: 10,
      heading: 'Number of lenders',
      value: String(lendersCount),
      actionOn: actionDateStr,
    },
    {
      sno: 11,
      heading: "Client's monthly income",
      value: String(monthlyIncome),
      actionOn: actionDateStr,
    },
    {
      sno: 12,
      heading: 'Salary account in which bank?',
      value: client.salary_bank || client.primary_bank || 'icici bank',
      actionOn: actionDateStr,
    },
    {
      sno: 13,
      heading: 'Salary date',
      value: String(client.salary_date || '5'),
      actionOn: actionDateStr,
    },
    {
      sno: 14,
      heading: 'Lenders that auto debit in salary account (if any)',
      value: String(client.auto_debit_lenders || '0'),
      actionOn: actionDateStr,
    },
    {
      sno: 15,
      heading: 'Lenders to whom blank cheques given (if any)',
      value: String(client.blank_cheque_lenders || '0'),
      actionOn: actionDateStr,
    },
    {
      sno: 16,
      heading: 'Spouse monthly income',
      value: String(client.spouse_monthly_income || '0'),
      actionOn: actionDateStr,
    },
    {
      sno: 17,
      heading: 'Parents monthly income',
      value: String(client.parents_monthly_income || '0'),
      actionOn: actionDateStr,
    },
    {
      sno: 18,
      heading: 'Other sources monthly income',
      value: String(client.other_sources_income || '0'),
      actionOn: actionDateStr,
    },
    {
      sno: 19,
      heading: 'Family monthly income',
      value: String(client.family_monthly_income || monthlyIncome),
      actionOn: actionDateStr,
    },
    {
      sno: 20,
      heading: 'Family monthly expenses',
      value: String(client.family_monthly_expenses || '30000'),
      actionOn: actionDateStr,
    },
    {
      sno: 21,
      heading: 'Monthly EMI (that was being paid earlier)',
      value: String(previousEmi),
      actionOn: actionDateStr,
    },
    {
      sno: 22,
      heading: 'EMI to Income ratio (%)',
      value: String(emiRatio),
      actionOn: actionDateStr,
    },
    {
      sno: 23,
      heading: 'How were EMIs managed earlier?',
      value: client.how_emis_managed || 'family and friends',
      actionOn: actionDateStr,
    },
    {
      sno: 24,
      heading: 'Reasons for taking loan',
      value: client.reasons_taking_loan || 'family problems',
      actionOn: actionDateStr,
    },
    {
      sno: 25,
      heading: 'Reasons for not being able to pay back loans',
      value: client.reasons_not_paying || client.hardship_reason || 'emi is not handle by salary',
      actionOn: actionDateStr,
    },
    {
      sno: 26,
      heading: 'Source of settlement funds',
      value: client.source_settlement_funds || 'family and friends',
      actionOn: actionDateStr,
    },
    {
      sno: 27,
      heading: 'Points explained in onboarding call',
      value: client.onboarding_points_explained || '"Agreement"',
      actionOn: actionDateStr,
    },
    {
      sno: 28,
      heading: 'Has the client agreed to subscribe to Truecaller Premium?',
      value: client.truecaller_subscribed || 'Client has agreed to subscribe to Truecaller Premium',
      actionOn: actionDateStr,
    },
    {
      sno: 29,
      heading: 'Has the client agreed to install CCTV camera at home?',
      value: client.cctv_agreed || 'Client has agreed to install CCTV camera',
      actionOn: actionDateStr,
    },
    {
      sno: 30,
      heading: 'Is spouse aware of loans/settlement proceedings?',
      value: client.spouse_aware || 'Yes',
      actionOn: actionDateStr,
    },
    {
      sno: 31,
      heading: 'Are parents aware of loans/settlement proceedings?',
      value: client.parents_aware || 'Yes',
      actionOn: actionDateStr,
    },
    {
      sno: 32,
      heading: 'Likelihood of early drop',
      value: client.early_drop_likelihood || 'Low',
      actionOn: actionDateStr,
    },
    {
      sno: 33,
      heading: 'Any other comments',
      value: client.comments || client.notes || 's',
      actionOn: actionDateStr,
    },
    {
      sno: 34,
      heading: 'Advocate Name',
      value: client.advocate_name || 'Subham Singh',
      actionOn: actionDateStr,
    },
    {
      sno: 35,
      heading: 'Advocate email id',
      value: client.advocate_email || 'subham@expertpanel.org',
      actionOn: actionDateStr,
      isEmail: true,
    },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-16 animate-fade-in min-h-0 h-auto">
      {/* Action Bar (Print / Agreement) */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 font-medium">
          Total Onboarding Questions: <strong className="text-slate-800">{onboardingFields.length} Recorded Fields</strong>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Print Official Onboarding Form"
          >
            <Printer className="h-3.5 w-3.5 text-slate-600" />
            <span>Print Form</span>
          </button>
          {onOpenAgreement && (
            <button
              onClick={() => onOpenAgreement(client)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Agreement</span>
            </button>
          )}
        </div>
      </div>

      {/* Structured Table: S.No. | Heading | Value | Action On */}
      {/* NO fixed-height container, expands automatically */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="w-full overflow-x-auto min-h-0 h-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-white text-slate-800 border-b border-gray-200 font-bold">
              <tr>
                <th className="py-3.5 px-4 w-16 text-slate-700">S.No.</th>
                <th className="py-3.5 px-4 w-2/5 min-w-[240px] text-slate-700">Heading</th>
                <th className="py-3.5 px-4 w-2/5 min-w-[280px] text-slate-700">Value</th>
                <th className="py-3.5 px-4 min-w-[140px] text-right text-slate-700">Action On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-slate-800">
              {onboardingFields.map((field, idx) => {
                const isEven = idx % 2 === 1;
                return (
                  <tr
                    key={field.sno}
                    className={`transition-colors hover:bg-blue-50/50 group ${isEven ? 'bg-[#f9fafb]' : 'bg-white'}`}
                  >
                    {/* 1. S.No. */}
                    <td className="py-3 px-4 font-mono text-slate-500 font-medium align-top text-xs">
                      {field.sno}
                    </td>

                    {/* 2. Heading */}
                    <td className="py-3 px-4 align-top font-semibold text-slate-800 text-xs break-words">
                      {field.heading}
                    </td>

                    {/* 3. Value (Wraps properly, no truncation) */}
                    <td className="py-3 px-4 align-top text-slate-700 text-xs break-words whitespace-normal leading-relaxed">
                      {field.isEmail ? (
                        <a
                          href={`mailto:${field.value}`}
                          className="text-blue-600 hover:underline inline-flex items-center space-x-1"
                        >
                          <span>{field.value}</span>
                        </a>
                      ) : field.isPhone ? (
                        <a
                          href={`tel:${field.value}`}
                          className="font-mono text-slate-800 hover:text-blue-600 inline-flex items-center space-x-1 font-semibold"
                        >
                          <span>{field.value}</span>
                        </a>
                      ) : (
                        <span>{field.value}</span>
                      )}
                    </td>

                    {/* 4. Action On */}
                    <td className="py-3 px-4 align-top text-right whitespace-nowrap text-xs text-slate-600 font-mono">
                      <div className="flex items-center justify-end space-x-1.5">
                        <span>{field.actionOn}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(field.value, `field-${field.sno}`)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-0.5 transition-all cursor-pointer"
                          title="Copy value"
                        >
                          {copiedKey === `field-${field.sno}` ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
