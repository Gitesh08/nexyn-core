"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  {
    question: "What exactly is Nexyn?",
    answer: "Nexyn is a biomimetic memory layer that sits on top of Cognee. It adds automated importance evaluation, mathematical memory decay, and instinctual consolidation, preventing context bloat and keeping your AI's knowledge graph lean and relevant."
  },
  {
    question: "Doesn't Cognee already manage AI memory?",
    answer: "Cognee is a powerful engine for building and querying knowledge graphs. However, without a filtering layer, every piece of data is stored permanently, causing context bloat. Nexyn wraps Cognee by scoring each input before it enters the graph, ensuring only high-value information is retained and stale data naturally decays."
  },
  {
    question: "How difficult is the integration?",
    answer: "Very simple. Just install nexyn-core and call `nexyn.remember()` instead of `cognee.remember()`. Nexyn intercepts the call, evaluates the input's importance score, and decides whether to store, decay, or drop it. No changes needed to the rest of your Cognee setup."
  },
  {
    question: "Does the evaluation layer add high latency?",
    answer: "Minimal impact. The evaluation layer calls a fast NIM-hosted language model with a strict schema response. In practice this adds under a second to the ingest path. The improvement in retrieval quality and reduced graph bloat far outweighs this overhead."
  },
  {
    question: "Is this open source?",
    answer: "Yes. Nexyn is fully open-source. You can self-host the backend on any Python-compatible server and point it at your own Cognee instance, or use it alongside Cognee Cloud."
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-[800px] mx-auto pt-24 pb-12 px-6 font-sans relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tighter">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="flex flex-col">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <div key={index} className="border-b border-[#333333]">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between py-6 text-left hover:text-[#E5E5E5] transition-colors focus:outline-none"
              >
                <span className="text-white font-medium text-lg tracking-tight">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="text-[#888888] shrink-0 ml-4"
                >
                  <Plus className="w-5 h-5" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 text-[#888888] text-base leading-relaxed pr-8">
                      {/* Handle inline code block styling for the integration question */}
                      {faq.answer.includes("`") ? (
                        faq.answer.split(/(`[^`]+`)/).map((part, i) => 
                          part.startsWith("`") ? (
                            <span key={i} className="font-mono text-white bg-[#111111] px-1.5 py-0.5 rounded text-sm">
                              {part.replace(/`/g, "")}
                            </span>
                          ) : (
                            <span key={i}>{part}</span>
                          )
                        )
                      ) : (
                        faq.answer
                      )}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
