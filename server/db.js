const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'crm.sqlite');

let db = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();
  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Initialize tables
  initSchema(db);
  seedInitialData(db);
  saveDb();

  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

function initSchema(database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id TEXT UNIQUE,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      city TEXT,
      outstanding_amount TEXT,
      monthly_income REAL DEFAULT 0,
      loan_type TEXT,
      default_status TEXT DEFAULT 'yes',
      harassment_calls TEXT DEFAULT 'yes',
      assigned_consultant TEXT DEFAULT 'Dhruv',
      lead_status TEXT DEFAULT 'New',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      city TEXT,
      pan TEXT,
      address TEXT,
      service_fee REAL DEFAULT 0,
      fees_date TEXT,
      fees_status TEXT DEFAULT 'Pending',
      pending_amount REAL DEFAULT 0,
      received_amount REAL DEFAULT 0,
      this_month_received REAL DEFAULT 0,
      case_status TEXT DEFAULT 'Active',
      assigned_consultant TEXT DEFAULT 'Dhruv',
      assigned_advocate TEXT DEFAULT 'Adv Sparsh Gupta',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS agreements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id_ref INTEGER,
      client_name TEXT,
      email TEXT,
      phone TEXT,
      pan TEXT,
      lender TEXT,
      loan_account_number TEXT,
      loan_amount REAL DEFAULT 0,
      loan_type TEXT,
      agreement_date TEXT,
      status TEXT DEFAULT 'Active',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_status TEXT DEFAULT 'Completed',
      payment_method TEXT DEFAULT 'Bank Transfer',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedInitialData(database) {
  // Check if users exist
  const resUsers = database.exec("SELECT COUNT(*) as count FROM users");
  const userCount = resUsers[0]?.values[0][0] || 0;

  if (userCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin123', salt);
    database.run(
      "INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)",
      ['Admin User', 'admin@reduceddebts.in', hash, 'admin', 'active']
    );
    database.run(
      "INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)",
      ['Dhruv Consultant', 'dhruv@reduceddebts.in', hash, 'consultant', 'active']
    );
  }

  // Check clients
  const resClients = database.exec("SELECT COUNT(*) as count FROM clients");
  const clientCount = resClients[0]?.values[0][0] || 0;

  if (clientCount === 0) {
    const initialClients = [
      {
        client_id: '60633',
        name: 'Mukesh Kumar',
        phone: '9997332524',
        email: 'avikormukesh977@gmail.com',
        city: 'Uttarakhand',
        pan: 'AQWPX1234F',
        address: 'Dehradun, Uttarakhand',
        service_fee: 24000.00,
        fees_date: '07 Aug 2026',
        fees_status: 'Pending',
        pending_amount: 2500,
        received_amount: 21500,
        this_month_received: 21500,
        case_status: 'Active',
        assigned_consultant: 'Dhruv',
        assigned_advocate: 'Adv Kalia Sudharani'
      },
      {
        client_id: '60610',
        name: 'Chhibu Ammernath',
        phone: '7357508484',
        email: 'ammernathchhibu2018@gmail.com',
        city: 'Pune',
        pan: 'AQJPV8099G',
        address: 'Kothrud, Pune, Maharashtra',
        service_fee: 22000.00,
        fees_date: '04 Aug 2026',
        fees_status: 'Pending',
        pending_amount: 7000,
        received_amount: 15000,
        this_month_received: 10000,
        case_status: 'Active',
        assigned_consultant: 'Dhruv',
        assigned_advocate: 'Adv Renu Sharma'
      },
      {
        client_id: '60488',
        name: 'Nazeer',
        phone: '9518711918',
        email: 'nazeermlove955@gmail.com',
        city: 'Karnataka',
        pan: 'BKMPZ9821L',
        address: 'Bangalore Urban, Karnataka',
        service_fee: 25000.00,
        fees_date: '19 Jul 2026',
        fees_status: 'Pending',
        pending_amount: 22000,
        received_amount: 3000,
        this_month_received: 0,
        case_status: 'Active',
        assigned_consultant: 'Dhruv',
        assigned_advocate: 'Adv Renu Sharma'
      },
      {
        client_id: '60427',
        name: 'Nitesh Kumar bansal',
        phone: '9125189072',
        email: 'niteshbansal75@gmail.com',
        city: 'Rajasthan',
        pan: 'DFGTY4412K',
        address: 'Jaipur, Rajasthan',
        service_fee: 24000.00,
        fees_date: '05 Jul 2026',
        fees_status: 'Pending',
        pending_amount: 24000,
        received_amount: 0,
        this_month_received: 0,
        case_status: 'Active',
        assigned_consultant: 'Dhruv',
        assigned_advocate: 'Adv Sparsh Gupta'
      },
      {
        client_id: '60382',
        name: 'Chandan Mandi',
        phone: '9373857181',
        email: 'chandanmandi88@gmail.com',
        city: 'Hyderabad',
        pan: 'GHJKL7789O',
        address: 'Gachibowli, Hyderabad, Telangana',
        service_fee: 19000.00,
        fees_date: '28 Jun 2026',
        fees_status: 'Pending',
        pending_amount: 9000,
        received_amount: 10000,
        this_month_received: 0,
        case_status: 'Active',
        assigned_consultant: 'Dhruv',
        assigned_advocate: 'Adv Kalia Sudharani'
      },
      {
        client_id: '60362',
        name: 'Sunil Singh',
        phone: '7498995204',
        email: 'techleads05@gmail.com',
        city: 'Ahmedabad',
        pan: 'POIUY3321A',
        address: 'Navrangpura, Ahmedabad, Gujarat',
        service_fee: 12000.00,
        fees_date: '22 Jun 2026',
        fees_status: 'Pending',
        pending_amount: 6000,
        received_amount: 6000,
        this_month_received: 0,
        case_status: 'Active',
        assigned_consultant: 'Dhruv',
        assigned_advocate: 'Adv Rrishabh Pratap Singh'
      },
      {
        client_id: '60076',
        name: 'Bhupendra kumar Gohil',
        phone: '7487044875',
        email: 'bhupendragohil@gmail.com',
        city: 'Vadodara',
        pan: 'MNBVC5543D',
        address: 'Alkapuri, Vadodara, Gujarat',
        service_fee: 20000.00,
        fees_date: '12 Jun 2026',
        fees_status: 'Pending',
        pending_amount: 8000,
        received_amount: 12000,
        this_month_received: 0,
        case_status: 'Active',
        assigned_consultant: 'Dhruv',
        assigned_advocate: 'Adv Sparsh Gupta'
      },
      {
        client_id: '60054',
        name: 'Arjit Kumar Shandilya',
        phone: '+918700205227',
        email: 'ijitsm721@gmail.com',
        city: 'Noida - Ashok Nagar',
        pan: 'ZXCVB9981E',
        address: 'Sector 15, Noida, UP',
        service_fee: 27000.00,
        fees_date: '10 Jun 2026',
        fees_status: 'Pending',
        pending_amount: 7300,
        received_amount: 19700,
        this_month_received: 0,
        case_status: 'Active',
        assigned_consultant: 'Dhruv',
        assigned_advocate: 'Adv Sparsh Gupta'
      },
      {
        client_id: '60032',
        name: 'Sanjay Aggarwal',
        phone: '9784559959',
        email: 'sanjay.aggarwal6@gmail.com',
        city: 'Rajasthan',
        pan: 'LKJHG1122F',
        address: 'Kota, Rajasthan',
        service_fee: 28000.00,
        fees_date: '01 Jun 2026',
        fees_status: 'Pending',
        pending_amount: 9000,
        received_amount: 19000,
        this_month_received: 0,
        case_status: 'Active',
        assigned_consultant: 'Dhruv',
        assigned_advocate: 'Adv Sparsh Gupta'
      },
      {
        client_id: '60004',
        name: 'Sneha soanli naayak',
        phone: '9075194714',
        email: 'snehachoudharybabuche@gmail.com',
        city: 'Nashik',
        pan: 'WERTY6654G',
        address: 'College Road, Nashik, Maharashtra',
        service_fee: 20000.00,
        fees_date: '01 Jun 2026',
        fees_status: 'Pending',
        pending_amount: 2000,
        received_amount: 18000,
        this_month_received: 0,
        case_status: 'Active',
        assigned_consultant: 'Dhruv',
        assigned_advocate: 'Adv Sakshi Pal'
      },
      {
        client_id: '60001',
        name: 'Syed Moin',
        phone: '+919117252709',
        email: 'aldsayed@gmail.com',
        city: 'Karnataka',
        pan: 'IUYTR8876H',
        address: 'Mysuru, Karnataka',
        service_fee: 23000.00,
        fees_date: '15 May 2026',
        fees_status: 'Pending',
        pending_amount: 9000,
        received_amount: 14000,
        this_month_received: 0,
        case_status: 'Active',
        assigned_consultant: 'Dhruv',
        assigned_advocate: 'Adv Sakshi Pal'
      },
      {
        client_id: '60033',
        name: 'Surajit Biswas',
        phone: '+918003115904',
        email: 'gps1111@gmail.com',
        city: 'Kolkata',
        pan: 'NBVCX2234J',
        address: 'Salt Lake, Kolkata, West Bengal',
        service_fee: 30000.00,
        fees_date: '08 May 2026',
        fees_status: 'Paid',
        pending_amount: 0,
        received_amount: 30000,
        this_month_received: 5000,
        case_status: 'Active',
        assigned_consultant: 'Dhruv',
        assigned_advocate: 'Adv Tamanna Swami'
      }
    ];

    for (const c of initialClients) {
      database.run(`
        INSERT INTO clients (
          client_id, name, phone, email, city, pan, address, service_fee,
          fees_date, fees_status, pending_amount, received_amount, this_month_received,
          case_status, assigned_consultant, assigned_advocate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        c.client_id, c.name, c.phone, c.email, c.city, c.pan, c.address, c.service_fee,
        c.fees_date, c.fees_status, c.pending_amount, c.received_amount, c.this_month_received,
        c.case_status, c.assigned_consultant, c.assigned_advocate
      ]);
    }
  }

  // Check leads
  const resLeads = database.exec("SELECT COUNT(*) as count FROM leads");
  const leadCount = resLeads[0]?.values[0][0] || 0;

  if (leadCount === 0) {
    const initialLeads = [
      { lead_id: 'LD-101', name: 'Prashant Narang', email: 'prashantn@gmail.com', phone: '9711200114', city: 'Kalyan', outstanding_amount: '50,000 - 1,00,000', monthly_income: 35000, loan_type: 'multiple_app_loan_settlement', default_status: 'yes', harassment_calls: 'yes', assigned_consultant: 'Dhruv', lead_status: 'New', created_at: '2026-08-13 20:30:00' },
      { lead_id: 'LD-102', name: 'Vikram', email: 'vikramkhatri@gmail.com', phone: '9896001201', city: 'Sonipat (Urban Area)', outstanding_amount: '1,00,000 - 3,00,000', monthly_income: 42000, loan_type: 'personal_loan_settlement', default_status: 'yes', harassment_calls: 'yes', assigned_consultant: 'Dhruv', lead_status: 'New', created_at: '2026-08-13 20:25:00' },
      { lead_id: 'LD-103', name: 'Mukesh Bhuriya', email: 'mukeshb@gmail.com', phone: '9424108779', city: 'Vadodara', outstanding_amount: '3,00,000 - 5,00,000', monthly_income: 25000, loan_type: 'personal_loan_settlement', default_status: 'yes', harassment_calls: 'yes', assigned_consultant: 'Dhruv', lead_status: 'New', created_at: '2026-08-13 20:10:00' },
      { lead_id: 'LD-104', name: 'Dinesh Sharma', email: 'dinesh.sharma77@gmail.com', phone: '9785002119', city: 'Kolkata', outstanding_amount: 'above_10,00,000', monthly_income: 60000, loan_type: 'multiple_app_loan_settlement', default_status: 'no', harassment_calls: 'no', assigned_consultant: 'Dhruv', lead_status: 'Contacted', created_at: '2026-08-13 19:40:00' },
      { lead_id: 'LD-105', name: 'Amit Yadav', email: 'amityadav999@gmail.com', phone: '9920114758', city: 'Mumbai', outstanding_amount: '50,000 - 1,00,000', monthly_income: 28000, loan_type: 'personal_loan_settlement', default_status: 'yes', harassment_calls: 'yes', assigned_consultant: 'Dhruv', lead_status: 'Interested', created_at: '2026-08-13 19:20:00' },
      { lead_id: 'LD-106', name: 'Ashish Chouhan', email: 'ashishch@gmail.com', phone: '9827011400', city: 'Indore', outstanding_amount: '1,00,000 - 3,00,000', monthly_income: 38000, loan_type: 'personal_loan_settlement', default_status: 'yes', harassment_calls: 'yes', assigned_consultant: 'Dhruv', lead_status: 'Follow up', created_at: '2026-08-13 18:50:00' },
      { lead_id: 'LD-107', name: 'Md Ali Ansari', email: 'mdali.ansari@gmail.com', phone: '9162009844', city: 'Lucknow', outstanding_amount: 'less_than_1,00,000', monthly_income: 18000, loan_type: 'personal_loan_settlement', default_status: 'yes', harassment_calls: 'yes', assigned_consultant: 'Dhruv', lead_status: 'New', created_at: '2026-08-13 18:15:00' },
      { lead_id: 'LD-108', name: 'Vicky Rajput', email: 'vickyrajput@gmail.com', phone: '8877221099', city: 'Ahmedabad', outstanding_amount: 'less_than_1,00,000', monthly_income: 22000, loan_type: 'other', default_status: 'yes', harassment_calls: 'no', assigned_consultant: 'Dhruv', lead_status: 'New', created_at: '2026-08-13 17:50:00' },
      { lead_id: 'LD-109', name: 'Surya', email: 'suryak2001@gmail.com', phone: '9347510200', city: 'Guntur', outstanding_amount: '50,000 - 1,00,000', monthly_income: 15000, loan_type: 'personal_loan_settlement', default_status: 'yes', harassment_calls: 'yes', assigned_consultant: 'Dhruv', lead_status: 'Converted', created_at: '2026-08-13 17:30:00' },
      { lead_id: 'LD-110', name: 'Mithilesh Sah', email: 'somnathsah@gmail.com', phone: '9934488711', city: 'Deoghar', outstanding_amount: '50,000 - 1,00,000', monthly_income: 12000, loan_type: 'multiple_app_loan_settlement', default_status: 'no', harassment_calls: 'yes', assigned_consultant: 'Dhruv', lead_status: 'New', created_at: '2026-08-13 16:45:00' },
      { lead_id: 'LD-111', name: 'Tahir', email: 'shoaibtahir01@gmail.com', phone: '8700980905', city: 'Indore', outstanding_amount: '1,00,000 - 3,00,000', monthly_income: 30000, loan_type: 'personal_loan_settlement', default_status: 'yes', harassment_calls: 'no', assigned_consultant: 'Dhruv', lead_status: 'Not Interested', created_at: '2026-08-13 16:00:00' },
      { lead_id: 'LD-112', name: 'Praveen Somanavale', email: 'praveensom@gmail.com', phone: '9845112233', city: 'Belgaum', outstanding_amount: 'above_10,00,000', monthly_income: 75000, loan_type: 'multiple_app_loan_settlement', default_status: 'paying_with_difficulty', harassment_calls: 'no', assigned_consultant: 'Dhruv', lead_status: 'Follow up', created_at: '2026-08-13 15:30:00' },
      { lead_id: 'LD-113', name: 'Santu', email: 'santu.nayak@gmail.com', phone: '9438001122', city: 'Kalyan Nagar', outstanding_amount: '75,000 - 1,50,000', monthly_income: 24000, loan_type: 'multiple_app_loan_settlement', default_status: 'yes', harassment_calls: 'yes', assigned_consultant: 'Dhruv', lead_status: 'Interested', created_at: '2026-08-13 14:20:00' },
      { lead_id: 'LD-114', name: 'Gita Mandal', email: 'gita.mandal@gmail.com', phone: '8271100912', city: 'Patna', outstanding_amount: '50,000 - 1,00,000', monthly_income: 19000, loan_type: 'personal_loan_settlement', default_status: 'yes', harassment_calls: 'no', assigned_consultant: 'Dhruv', lead_status: 'New', created_at: '2026-08-13 13:10:00' },
      { lead_id: 'LD-115', name: 'Jitender Kumar', email: 'jituverma@gmail.com', phone: '9729120034', city: 'Hisar', outstanding_amount: '1,50,000 - 3,00,000', monthly_income: 32000, loan_type: 'personal_loan_settlement', default_status: 'yes', harassment_calls: 'yes', assigned_consultant: 'Dhruv', lead_status: 'Contacted', created_at: '2026-08-13 12:40:00' },
      { lead_id: 'LD-116', name: 'Tarun Maurya', email: 'mauryatarun@gmail.com', phone: '8707110419', city: 'Varanasi', outstanding_amount: 'less_than_1,00,000', monthly_income: 21000, loan_type: 'personal_loan_settlement', default_status: 'yes', harassment_calls: 'yes', assigned_consultant: 'Dhruv', lead_status: 'New', created_at: '2026-08-13 11:30:00' },
      { lead_id: 'LD-117', name: 'Sagar Naik', email: 'naiksagar99@gmail.com', phone: '9420011745', city: 'Satara', outstanding_amount: '1,50,000 - 3,00,000', monthly_income: 27000, loan_type: 'multiple_app_loan_settlement', default_status: 'yes', harassment_calls: 'no', assigned_consultant: 'Dhruv', lead_status: 'New', created_at: '2026-08-13 10:15:00' },
      { lead_id: 'LD-118', name: 'Manishwar Shekhawat', email: 'mshekhawat1988@gmail.com', phone: '9928004455', city: 'Sikar', outstanding_amount: '50,000 - 1,00,000', monthly_income: 34000, loan_type: 'personal_loan_settlement', default_status: 'yes', harassment_calls: 'yes', assigned_consultant: 'Dhruv', lead_status: 'Interested', created_at: '2026-08-13 09:00:00' },
      { lead_id: 'LD-119', name: 'Rupesh Jangama', email: 'rupeshjangama@gmail.com', phone: '9769002233', city: 'Mumbai', outstanding_amount: '50,000 - 1,00,000', monthly_income: 45000, loan_type: 'multiple_app_loan_settlement', default_status: 'paying_with_difficulty', harassment_calls: 'no', assigned_consultant: 'Dhruv', lead_status: 'New', created_at: '2026-08-12 18:00:00' },
      { lead_id: 'LD-120', name: 'Paresh Ghadle', email: 'pareshg1982@gmail.com', phone: '8378100911', city: 'Pune', outstanding_amount: '3,00,000 - 5,00,000', monthly_income: 50000, loan_type: 'personal_loan_settlement', default_status: 'yes', harassment_calls: 'yes', assigned_consultant: 'Dhruv', lead_status: 'Follow up', created_at: '2026-08-12 16:20:00' }
    ];

    for (const l of initialLeads) {
      database.run(`
        INSERT INTO leads (
          lead_id, name, email, phone, city, outstanding_amount, monthly_income,
          loan_type, default_status, harassment_calls, assigned_consultant, lead_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        l.lead_id, l.name, l.email, l.phone, l.city, l.outstanding_amount, l.monthly_income,
        l.loan_type, l.default_status, l.harassment_calls, l.assigned_consultant, l.lead_status, l.created_at
      ]);
    }
  }

  // Check agreements
  const resAgreements = database.exec("SELECT COUNT(*) as count FROM agreements");
  const agreementCount = resAgreements[0]?.values[0][0] || 0;

  if (agreementCount === 0) {
    const initialAgreements = [
      {
        client_name: 'Mukesh Kumar',
        email: 'avikormukesh977@gmail.com',
        phone: '9997332524',
        pan: 'AQWPX1234F',
        lender: 'Home Credit, IDFC First Bank, MoneyWide, Cred, Cred',
        loan_account_number: '₹ 15000, 21000, 45000, 9500, 12500',
        loan_amount: 103000,
        loan_type: 'Personal Loan, Personal Loan, Personal Loan, Personal Loan, Personal Loan',
        agreement_date: '07 Aug 2026',
        status: 'Active'
      },
      {
        client_name: 'Chhibu Ammernath',
        email: 'ammernathchhibu2018@gmail.com',
        phone: '7357508484',
        pan: 'AQJPV8099G',
        lender: 'Fundee, QuickLoan, Loan Front, Kissht, Navi, RupeeRedee, LoanTap, TrueBalance, MoneyTap, MoneyView, KreditBee, Cashe, EarlySalary, PaySense, Ring, Stashfin, Branch, SmartCoin, Rupeek, Fibe, PayMeIndia, Lendingkart, KrazyBee, Faircent, Olyv, Kreditzy, Payday Loan, Aditya Birla Capital, FlexSalary, Lazypay',
        loan_account_number: '₹ 25000, 18000, 45000, 12000, 60000, 35000, 15000, 22000, 40000, 50000, 18000, 30000, 14000, 28000, 35000, 42000, 16000, 25000, 55000, 32000, 19000, 48000, 26000, 31000, 20000, 17000, 38000, 24000, 29000, 44000',
        loan_amount: 889000,
        loan_type: 'Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Personal Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan, Payday Loan',
        agreement_date: '04 Aug 2026',
        status: 'Active'
      }
    ];

    for (const a of initialAgreements) {
      database.run(`
        INSERT INTO agreements (
          client_name, email, phone, pan, lender, loan_account_number, loan_amount, loan_type, agreement_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        a.client_name, a.email, a.phone, a.pan, a.lender, a.loan_account_number, a.loan_amount, a.loan_type, a.agreement_date, a.status
      ]);
    }
  }

  // Seed some payments
  const resPayments = database.exec("SELECT COUNT(*) as count FROM payments");
  const paymentCount = resPayments[0]?.values[0][0] || 0;
  if (paymentCount === 0) {
    database.run("INSERT INTO payments (client_id, amount, payment_date, payment_status, payment_method) VALUES (?, ?, ?, ?, ?)", [1, 21500, '2026-08-07', 'Completed', 'UPI']);
    database.run("INSERT INTO payments (client_id, amount, payment_date, payment_status, payment_method) VALUES (?, ?, ?, ?, ?)", [2, 10000, '2026-08-04', 'Completed', 'NetBanking']);
    database.run("INSERT INTO payments (client_id, amount, payment_date, payment_status, payment_method) VALUES (?, ?, ?, ?, ?)", [12, 5000, '2026-08-08', 'Completed', 'UPI']);
  }
}

// Query helper functions
function queryAll(database, sql, params = []) {
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(database, sql, params = []) {
  const rows = queryAll(database, sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function executeRun(database, sql, params = []) {
  database.run(sql, params);
  saveDb();
  // Get last insert ID
  const res = database.exec("SELECT last_insert_rowid() as id");
  return res[0]?.values[0][0] || 0;
}

module.exports = {
  getDb,
  saveDb,
  queryAll,
  queryOne,
  executeRun
};
