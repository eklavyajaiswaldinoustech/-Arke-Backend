import { useState, useEffect } from "react";
import { useStore } from "../context/useStore";

const THEME = {
  bg: "#faf8f5",
  surface: "#ffffff",
  text: "#2a2a2a",
  textMuted: "#8a8a8a",
  rose: "#e8b4c4",
  blush: "#f5d5e0",
  burgundy: "#8b4654",
  champagne: "#e8d4c2",
  border: "#e8ddd4",
  borderLight: "#f0ebe5",
  success: "#70c878",
  error: "#d97070",
};

const API_BASE = "http://localhost:5050/api";

export default function Bankdetails() {
  const { user } = useStore();
  const [bankData, setBankData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [formData, setFormData] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    accountType: "savings",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user?._id || user?.id) {
      fetchBankdetails();
    } else {
      setLoading(false);
      setMessage("Please log in to manage bank details");
      setMessageType("error");
    }
  }, [user]);

  const fetchBankdetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/bank-details`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("arke_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setBankData(data.data || null);
        if (data.data) {
          setFormData({
            accountHolderName: data.data.accountHolderName || "",
            bankName: data.data.bankName || "",
            accountNumber: "",
            confirmAccountNumber: "",
            ifscCode: data.data.ifscCode || "",
            accountType: data.data.accountType || "savings",
          });
        } else {
          setFormData({
            accountHolderName: "",
            bankName: "",
            accountNumber: "",
            confirmAccountNumber: "",
            ifscCode: "",
            accountType: "savings",
          });
        }
      } else if (response.status === 404) {
        // No bank details exist yet - this is normal on first access
        console.log("No bank details found - user should add new details");
        setBankData(null);
        setFormData({
          accountHolderName: "",
          bankName: "",
          accountNumber: "",
          confirmAccountNumber: "",
          ifscCode: "",
          accountType: "savings",
        });
        setMessage(""); // Clear any error message
      } else {
        setMessage(data.message || "Failed to load bank details");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage("Network error. Please check your connection.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.accountHolderName.trim()) {
      setMessage("Please enter account holder name");
      setMessageType("error");
      return false;
    }

    if (!formData.bankName.trim()) {
      setMessage("Please select a bank");
      setMessageType("error");
      return false;
    }

    if (!formData.accountNumber || formData.accountNumber.length < 9) {
      setMessage("Please enter a valid account number (9-16 digits)");
      setMessageType("error");
      return false;
    }

    if (formData.accountNumber.length > 16) {
      setMessage("Account number cannot exceed 16 digits");
      setMessageType("error");
      return false;
    }

    if (formData.accountNumber !== formData.confirmAccountNumber) {
      setMessage("Account numbers do not match");
      setMessageType("error");
      return false;
    }

    if (!formData.ifscCode || formData.ifscCode.length !== 11) {
      setMessage("Please enter a valid IFSC code (11 characters)");
      setMessageType("error");
      return false;
    }

    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "ifscCode" ? value.toUpperCase() : value,
    }));
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    try {
      const response = await fetch(
        `${API_BASE}/bank-details`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("arke_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountHolderName: formData.accountHolderName,
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            ifscCode: formData.ifscCode.toUpperCase(),
            accountType: formData.accountType,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("✓ Bank details saved successfully");
        setMessageType("success");
        setBankData(data.data);
        setIsEditing(false);
        setFormData((prev) => ({
          ...prev,
          accountNumber: "",
          confirmAccountNumber: "",
        }));
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(data.message || "Failed to save bank details");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Submit error:", error);
      setMessage("Network error. Please try again.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) return "••••••••••••••••";
    const last4 = accountNumber.slice(-4);
    return `••••••••${last4}`;
  };

  const banks = [
    { value: "State Bank of India", label: "State Bank of India (SBI)" },
    { value: "HDFC Bank", label: "HDFC Bank" },
    { value: "ICICI Bank", label: "ICICI Bank" },
    { value: "Axis Bank", label: "Axis Bank" },
    { value: "Bank of Baroda", label: "Bank of Baroda" },
    { value: "Kotak Mahindra Bank", label: "Kotak Mahindra Bank" },
    { value: "Yes Bank", label: "Yes Bank" },
    { value: "IndusInd Bank", label: "IndusInd Bank" },
    { value: "Other", label: "Other Bank" },
  ];

  return (
    <div
      style={{
        background: THEME.bg,
        minHeight: "100vh",
        paddingTop: 120,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Cormorant+Garamond:wght@300;400;600&display=swap');

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .bank-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 40px 80px;
        }

        .bank-header {
          margin-bottom: 50px;
          animation: fadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .bank-header h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 52px;
          font-weight: 300;
          letter-spacing: 2px;
          color: ${THEME.text};
          margin-bottom: 12px;
          text-transform: uppercase;
          background: linear-gradient(135deg, ${THEME.text}, ${THEME.burgundy});
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .bank-header p {
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          letter-spacing: 0.5px;
          color: ${THEME.textMuted};
          font-weight: 400;
        }

        .security-notice {
          padding: 18px 20px;
          background: rgba(112, 200, 120, 0.08);
          border: 1.5px solid ${THEME.success}40;
          border-radius: 8px;
          margin-bottom: 40px;
          display: flex;
          gap: 14px;
          animation: slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .security-notice-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .security-notice-text {
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          color: ${THEME.success}90;
          letter-spacing: 0.3px;
          line-height: 1.6;
          font-weight: 500;
        }

        .bank-card {
          border: 1.5px solid ${THEME.border};
          border-radius: 12px;
          padding: 44px;
          background: ${THEME.surface};
          margin-bottom: 40px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
          animation: fadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 1.5px solid ${THEME.border};
        }

        .card-title {
          font-family: 'Poppins', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: ${THEME.burgundy};
        }

        .edit-btn {
          padding: 9px 18px;
          background: transparent;
          border: 1.5px solid ${THEME.rose};
          color: ${THEME.burgundy};
          border-radius: 6px;
          font-family: 'Poppins', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .edit-btn:hover {
          border-color: ${THEME.burgundy};
          background: linear-gradient(135deg, ${THEME.rose}20, ${THEME.burgundy}10);
          transform: translateY(-2px);
        }

        .bank-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 20px;
        }

        .info-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .info-label {
          font-family: 'Poppins', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: ${THEME.textMuted};
        }

        .info-value {
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          color: ${THEME.text};
          letter-spacing: 0.3px;
          font-weight: 500;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          font-family: 'Poppins', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: ${THEME.burgundy};
          margin-bottom: 10px;
          display: block;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 12px 14px;
          background: ${THEME.blush}15;
          border: 1.5px solid ${THEME.border};
          border-radius: 6px;
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          color: ${THEME.text};
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          letter-spacing: 0.3px;
        }

        .form-input::placeholder {
          color: ${THEME.textMuted}60;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          background: ${THEME.blush}25;
          border-color: ${THEME.rose};
          box-shadow: 0 0 0 3px ${THEME.blush}40;
        }

        .form-select option {
          background: ${THEME.surface};
          color: ${THEME.text};
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 32px;
        }

        .btn-primary {
          flex: 1;
          padding: 13px 32px;
          background: linear-gradient(135deg, ${THEME.rose}, ${THEME.burgundy});
          color: white;
          border: none;
          border-radius: 6px;
          font-family: 'Poppins', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 4px 16px rgba(232, 180, 196, 0.2);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(232, 180, 196, 0.35);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          flex: 1;
          padding: 13px 32px;
          background: transparent;
          color: ${THEME.burgundy};
          border: 1.5px solid ${THEME.rose};
          border-radius: 6px;
          font-family: 'Poppins', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .btn-secondary:hover {
          border-color: ${THEME.burgundy};
          background: linear-gradient(135deg, ${THEME.rose}20, ${THEME.burgundy}10);
          transform: translateY(-2px);
        }

        .message-alert {
          padding: 14px 16px;
          border-radius: 6px;
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          letter-spacing: 0.3px;
          margin-bottom: 20px;
          animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          font-weight: 500;
        }

        .success-message {
          background: rgba(112, 200, 120, 0.08);
          border: 1px solid ${THEME.success}40;
          color: ${THEME.success}90;
        }

        .error-message {
          background: rgba(217, 112, 112, 0.08);
          border: 1px solid ${THEME.error}40;
          color: ${THEME.error}90;
        }

        .info-message {
          background: rgba(100, 181, 246, 0.08);
          border: 1px solid rgba(100, 181, 246, 0.4);
          color: rgba(100, 181, 246, 0.9);
        }

        .loading-state {
          text-align: center;
          padding: 80px 40px;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid ${THEME.border};
          border-top-color: ${THEME.rose};
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 24px;
        }

        .loading-text {
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          color: ${THEME.textMuted};
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        @media (max-width: 768px) {
          .bank-container {
            padding: 0 20px 60px;
          }

          .bank-header h1 {
            font-size: 36px;
            letter-spacing: 1px;
          }

          .bank-card {
            padding: 32px;
          }

          .bank-info {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .button-group {
            flex-direction: column;
          }

          .card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
      `}</style>

      <div className="bank-container">
        {/* Header */}
        <div className="bank-header">
          <h1>Bank Details</h1>
          <p>Securely manage your account information</p>
        </div>

        {/* Security Notice */}
        <div className="security-notice">
          <div className="security-notice-icon">🔒</div>
          <div className="security-notice-text">
            Your bank details are encrypted with industry-standard AES-256 encryption. 
            We never share your information.
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`message-alert ${messageType}-message`}>
            {message}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading your bank details...</p>
          </div>
        )}

        {/* Bank Details Section */}
        {!loading && (
          <>
            {bankData && !isEditing ? (
              // Display Bank Details
              <div className="bank-card">
                <div className="card-header">
                  <div className="card-title">✓ Account Details</div>
                  <button
                    className="edit-btn"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Details
                  </button>
                </div>

                <div className="bank-info">
                  <div className="info-field">
                    <div className="info-label">Account Holder Name</div>
                    <div className="info-value">
                      {bankData.accountHolderName}
                    </div>
                  </div>

                  <div className="info-field">
                    <div className="info-label">Bank Name</div>
                    <div className="info-value">{bankData.bankName}</div>
                  </div>

                  <div className="info-field">
                    <div className="info-label">Account Number</div>
                    <div className="info-value">
                      {maskAccountNumber(bankData.accountNumber)}
                    </div>
                  </div>

                  <div className="info-field">
                    <div className="info-label">Account Type</div>
                    <div className="info-value">
                      {bankData.accountType?.charAt(0).toUpperCase() +
                        bankData.accountType?.slice(1)}
                    </div>
                  </div>

                  <div className="info-field">
                    <div className="info-label">IFSC Code</div>
                    <div className="info-value">{bankData.ifscCode}</div>
                  </div>

                  <div className="info-field">
                    <div className="info-label">Last Updated</div>
                    <div className="info-value">
                      {new Date(bankData.updatedAt).toLocaleDateString(
                        "en-IN",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Form for Adding/Editing Bank Details
              <div className="bank-card">
                <div className="card-title" style={{ marginBottom: 30 }}>
                  {bankData ? "Update Bank Details" : "Add Bank Details"}
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">
                      Account Holder Name *
                    </label>
                    <input
                      type="text"
                      name="accountHolderName"
                      className="form-input"
                      placeholder="Your full name"
                      value={formData.accountHolderName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bank Name *</label>
                    <select
                      name="bankName"
                      className="form-select"
                      value={formData.bankName}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select your bank</option>
                      {banks.map((bank) => (
                        <option key={bank.value} value={bank.value}>
                          {bank.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        Account Number *
                      </label>
                      <input
                        type="password"
                        name="accountNumber"
                        className="form-input"
                        placeholder="9-16 digits"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        minLength="9"
                        maxLength="16"
                        required
                        inputMode="numeric"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Confirm Account Number *
                      </label>
                      <input
                        type="password"
                        name="confirmAccountNumber"
                        className="form-input"
                        placeholder="Re-enter for safety"
                        value={formData.confirmAccountNumber}
                        onChange={handleChange}
                        minLength="9"
                        maxLength="16"
                        required
                        inputMode="numeric"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">IFSC Code *</label>
                      <input
                        type="text"
                        name="ifscCode"
                        className="form-input"
                        placeholder="e.g., SBIN0001234"
                        value={formData.ifscCode}
                        onChange={handleChange}
                        maxLength="11"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Account Type *</label>
                      <select
                        name="accountType"
                        className="form-select"
                        value={formData.accountType}
                        onChange={handleChange}
                      >
                        <option value="savings">Savings</option>
                        <option value="current">Current</option>
                        <option value="business">Business</option>
                      </select>
                    </div>
                  </div>

                  <div className="button-group">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Bank Details"}
                    </button>
                    {bankData && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setIsEditing(false);
                          setMessage("");
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
