"use client";

import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VastuAnalyzer } from "@/components/vastu/VastuAnalyzer";

export default function VastuPage() {
  return (
    <div className="container mx-auto p-3 md:p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
            Vastu Score
          </h1>
          <p className="text-lg text-muted-foreground mb-3">
            Upload a room photo to get an instant Vastu Shastra compliance score and personalized suggestions
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Badge className="bg-orange-100 text-orange-800">
              <Compass className="w-3 h-3 mr-1" />
              AI Element Detection
            </Badge>
            <Badge className="bg-amber-100 text-amber-800">
              120+ Vastu Rules
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800">
              Hindi &amp; English
            </Badge>
          </div>
        </motion.div>
      </div>

      <VastuAnalyzer />
    </div>
  );
}
