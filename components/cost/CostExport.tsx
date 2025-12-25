// components/cost/CostExport.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileImage,
  Mail,
  Share2,
  Printer,
  Copy,
  Check,
  Loader2,
  X,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import type { UICostChartData, CurrencyType } from "@/types/cost";

interface CostExportProps {
  costData: UICostChartData;
  projectName: string;
  roomType: string;
  style: string;
  currency: CurrencyType;
  renderImage?: string;
  className?: string;
}


interface ExportOption {
  id: string;
  label: string;
  labelHi: string;
  icon: React.ReactNode;
  format: string;
  description: string;
  descriptionHi: string;
}

const exportOptions: ExportOption[] = [
  {
    id: "pdf",
    label: "PDF Report",
    labelHi: "PDF रिपोर्ट",
    icon: <FileText className="h-5 w-5" />,
    format: "application/pdf",
    description: "Complete cost report with charts",
    descriptionHi: "चार्ट के साथ पूर्ण लागत रिपोर्ट"
  },
  {
    id: "excel",
    label: "Excel Spreadsheet",
    labelHi: "एक्सेल स्प्रेडशीट",
    icon: <FileSpreadsheet className="h-5 w-5" />,
    format: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    description: "Editable spreadsheet with formulas",
    descriptionHi: "फॉर्मूला के साथ संपादन योग्य स्प्रेडशीट"
  },
  {
    id: "csv",
    label: "CSV File",
    labelHi: "CSV फाइल",
    icon: <FileText className="h-5 w-5" />,
    format: "text/csv",
    description: "Simple data export",
    descriptionHi: "सरल डेटा निर्यात"
  },
  {
    id: "image",
    label: "Image (PNG)",
    labelHi: "छवि (PNG)",
    icon: <FileImage className="h-5 w-5" />,
    format: "image/png",
    description: "Visual cost breakdown",
    descriptionHi: "विज़ुअल लागत विवरण"
  }
];

const CostExport: React.FC<CostExportProps> = ({
  costData,
  projectName,
  roomType,
  style,
  currency,
  renderImage,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("download");
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  
  // Export options
  const [includeVastu, setIncludeVastu] = useState(true);
  const [includeChart, setIncludeChart] = useState(true);
  const [includeRender, setIncludeRender] = useState(true);
  const [includeMaterials, setIncludeMaterials] = useState(true);
  const [includeLabor, setIncludeLabor] = useState(true);
  const [includeTimeline, setIncludeTimeline] = useState(true);
  
  const { toast } = useToast();

  // Detect language
  React.useEffect(() => {
    const browserLang = navigator.language;
    if (browserLang.startsWith("hi")) {
      setLanguage("hi");
    }
  }, []);

  const t = (en: string, hi: string) => language === "hi" ? hi : en;

  const formatCurrency = (amount: number) => {
    if (currency === "INR") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const generateCSV = () => {
    const rows = [
      ["Removation.ai Cost Estimate"],
      ["Project", projectName],
      ["Room Type", roomType],
      ["Style", style],
      ["Date", new Date().toLocaleDateString()],
      [""],
      ["Category", "Item", "Cost"],
    ];

    // Materials
    if (includeMaterials) {
      rows.push(["Materials", "", ""]);
      costData.materials.forEach(material => {
        rows.push(["", material.name, formatCurrency(material.cost)]);
      });
      rows.push(["", "Subtotal", formatCurrency(costData.materialTotal)]);
    }

    // Labor
    
if (includeLabor) {
  rows.push(["Labor", "", ""]);
  rows.push(["", "Total Labor Cost", formatCurrency(costData.laborTotal)]);
}


    // Summary
    rows.push([""], ["Summary", "", ""]);
    rows.push(["", "Materials Total", formatCurrency(costData.materialTotal)]);
    rows.push(["", "Labor Total", formatCurrency(costData.laborTotal)]);
    rows.push(["", "GST/Tax", formatCurrency(costData.tax)]);
    rows.push(["", "Grand Total", formatCurrency(costData.grandTotal)]);

    return rows.map(row => row.join(",")).join("\n");
  };

  const generatePDFContent = () => {
    return {
      projectName,
      roomType,
      style,
      costData,
      currency,
      includeVastu,
      includeChart,
      includeRender,
      includeMaterials,
      includeLabor,
      includeTimeline,
      renderImage,
      generatedAt: new Date().toISOString()
    };
  };

  const handleExport = async (format: string) => {
    setIsExporting(true);
    setSelectedFormat(format);

    try {
      switch (format) {
        case "csv":
          const csvContent = generateCSV();
          const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          downloadBlob(csvBlob, `${projectName}-cost-estimate.csv`);
          break;

        case "pdf":
          const pdfContent = generatePDFContent();
          const pdfResponse = await fetch("/api/export/pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pdfContent)
          });
          
          if (pdfResponse.ok) {
            const pdfBlob = await pdfResponse.blob();
            downloadBlob(pdfBlob, `${projectName}-cost-estimate.pdf`);
          } else {
            throw new Error("PDF generation failed");
          }
          break;

        case "excel":
          const excelContent = generatePDFContent();
          const excelResponse = await fetch("/api/export/excel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(excelContent)
          });
          
          if (excelResponse.ok) {
            const excelBlob = await excelResponse.blob();
            downloadBlob(excelBlob, `${projectName}-cost-estimate.xlsx`);
          } else {
            throw new Error("Excel generation failed");
          }
          break;

        case "image":
          const imageContent = generatePDFContent();
          const imageResponse = await fetch("/api/export/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(imageContent)
          });
          
          if (imageResponse.ok) {
            const imageBlob = await imageResponse.blob();
            downloadBlob(imageBlob, `${projectName}-cost-estimate.png`);
          } else {
            throw new Error("Image generation failed");
          }
          break;
      }

      toast({
        title: t("Export Successful", "निर्यात सफल"),
        description: t(
          `Your ${format.toUpperCase()} file has been downloaded.`,
          `आपकी ${format.toUpperCase()} फ़ाइल डाउनलोड हो गई है।`
        ),
      });

      setIsOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: t("Export Failed", "निर्यात विफल"),
        description: t(
          "Something went wrong. Please try again.",
          "कुछ गलत हो गया। कृपया पुनः प्रयास करें।"
        ),
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleEmailSend = async () => {
    if (!email) {
      toast({
        title: t("Email Required", "ईमेल आवश्यक"),
        description: t("Please enter an email address.", "कृपया ईमेल पता दर्ज करें।"),
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/export/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ...generatePDFContent()
        })
      });

      if (response.ok) {
        toast({
          title: t("Email Sent", "ईमेल भेजा गया"),
          description: t(
            `Cost estimate sent to ${email}`,
            `लागत अनुमान ${email} पर भेजा गया`
          ),
        });
        setIsOpen(false);
      } else {
        throw new Error("Email sending failed");
      }
    } catch (error) {
      console.error("Email error:", error);
      toast({
        title: t("Send Failed", "भेजना विफल"),
        description: t(
          "Could not send email. Please try again.",
          "ईमेल नहीं भेज सका। कृपया पुनः प्रयास करें।"
        ),
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const shareData = {
        ...generatePDFContent(),
        shareId: `share_${Date.now()}`
      };

      const response = await fetch("/api/export/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shareData)
      });

      if (response.ok) {
        const { shareUrl } = await response.json();
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        
        toast({
          title: t("Link Copied", "लिंक कॉपी किया गया"),
          description: t(
            "Share link copied to clipboard",
            "शेयर लिंक क्लिपबोर्ड पर कॉपी किया गया"
          ),
        });
      }
    } catch (error) {
      console.error("Share error:", error);
      toast({
        title: t("Copy Failed", "कॉपी विफल"),
        description: t(
          "Could not copy link. Please try again.",
          "लिंक कॉपी नहीं कर सका। कृपया पुनः प्रयास करें।"
        ),
        variant: "destructive"
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={`gap-2 ${className}`}
        >
          <Download className="h-4 w-4" />
          {t("Export", "निर्यात")}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            {t("Export Cost Estimate", "लागत अनुमान निर्यात करें")}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="download" className="gap-2">
              <Download className="h-4 w-4" />
              {t("Download", "डाउनलोड")}
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              {t("Email", "ईमेल")}
            </TabsTrigger>
            <TabsTrigger value="share" className="gap-2">
              <Share2 className="h-4 w-4" />
              {t("Share", "शेयर")}
            </TabsTrigger>
          </TabsList>

          {/* Download Tab */}
          <TabsContent value="download" className="space-y-4 mt-4">
            {/* Export Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {t("Include in Export", "निर्यात में शामिल करें")}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox 
                    checked={includeMaterials} 
                    onCheckedChange={(checked) => setIncludeMaterials(!!checked)}
                  />
                  <span className="text-sm">
                    {t("Materials", "सामग्री")}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox 
                    checked={includeLabor} 
                    onCheckedChange={(checked) => setIncludeLabor(!!checked)}
                  />
                  <span className="text-sm">
                    {t("Labor Costs", "श्रम लागत")}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox 
                    checked={includeChart} 
                    onCheckedChange={(checked) => setIncludeChart(!!checked)}
                  />
                  <span className="text-sm">
                    {t("Charts", "चार्ट")}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox 
                    checked={includeVastu} 
                    onCheckedChange={(checked) => setIncludeVastu(!!checked)}
                  />
                  <span className="text-sm">
                    {t("Vastu Score", "वास्तु स्कोर")}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox 
                    checked={includeRender} 
                    onCheckedChange={(checked) => setIncludeRender(!!checked)}
                  />
                  <span className="text-sm">
                    {t("Design Render", "डिज़ाइन रेंडर")}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox 
                    checked={includeTimeline} 
                    onCheckedChange={(checked) => setIncludeTimeline(!!checked)}
                  />
                  <span className="text-sm">
                    {t("Timeline", "समयरेखा")}
                  </span>
                </label>
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {t("Select Format", "प्रारूप चुनें")}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {exportOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleExport(option.id)}
                    disabled={isExporting}
                    className={`
                      relative p-4 rounded-lg border-2 text-left transition-all
                      ${selectedFormat === option.id && isExporting 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"}
                      ${isExporting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {language === "hi" ? option.labelHi : option.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === "hi" ? option.descriptionHi : option.description}
                        </p>
                      </div>
                    </div>
                    
                    {selectedFormat === option.id && isExporting && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Print Button */}
            <Button 
              variant="outline" 
              className="w-full gap-2 mt-4"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" />
              {t("Print Cost Estimate", "लागत अनुमान प्रिंट करें")}
            </Button>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  {t("Recipient Email", "प्राप्तकर्ता ईमेल")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("Enter email address", "ईमेल पता दर्ज करें")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">
                  {t("Email will include:", "ईमेल में शामिल होगा:")}
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {t("PDF cost estimate report", "PDF लागत अनुमान रिपोर्ट")}</li>
                  <li>• {t("Design render image", "डिज़ाइन रेंडर छवि")}</li>
                  <li>• {t("Material breakdown", "सामग्री विवरण")}</li>
                  <li>• {t("Contractor contact link", "ठेकेदार संपर्क लिंक")}</li>
                </ul>
              </div>

              <Button 
                className="w-full gap-2"
                onClick={handleEmailSend}
                disabled={isSending || !email}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("Sending...", "भेज रहा है...")}
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    {t("Send Email", "ईमेल भेजें")}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Share Tab */}
          <TabsContent value="share" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  {t(
                    "Generate a shareable link for this cost estimate. Anyone with the link can view the estimate.",
                    "इस लागत अनुमान के लिए एक शेयर करने योग्य लिंक बनाएं। लिंक वाला कोई भी अनुमान देख सकता है।"
                  )}
                </p>
                
                <Button 
                  className="w-full gap-2"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      {t("Copied!", "कॉपी किया!")}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      {t("Copy Share Link", "शेयर लिंक कॉपी करें")}
                    </>
                  )}
                </Button>
              </div>

              {/* Social Share Buttons */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("Share via", "के माध्यम से साझा करें")}
                </Label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => {
                      window.open(
                        `https://wa.me/?text=${encodeURIComponent(`Check out my renovation cost estimate for ${projectName}`)}`,
                        "_blank"
                      );
                    }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => {
                      window.open(
                        `mailto:?subject=${encodeURIComponent(`Renovation Cost Estimate - ${projectName}`)}&body=${encodeURIComponent(`Check out my renovation cost estimate`)}`,
                        "_blank"
                      );
                    }}
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Summary Preview */}
        <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("Total Estimate", "कुल अनुमान")}
              </p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(costData.grandTotal)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {projectName}
              </p>
              <p className="text-xs text-muted-foreground">
                {roomType} • {style}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CostExport;