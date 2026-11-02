"use client";
import { animate } from "framer-motion";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownRenderer = ({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      h1: ({ children }) => <h1 className="text-xl font-bold text-neutral-100 mb-3">{children}</h1>,
      h2: ({ children }) => <h2 className="text-lg font-semibold text-neutral-200 mb-2">{children}</h2>,
      h3: ({ children }) => <h3 className="text-md font-medium text-neutral-200 mb-2">{children}</h3>,
      p: ({ children }) => <p className="mb-4 text-neutral-300 text-sm leading-relaxed">{children}</p>,
      ul: ({ children }) => <ul className="list-disc ml-6 space-y-1 mb-4">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal ml-6 space-y-1 mb-4">{children}</ol>,
      li: ({ children }) => <li className="text-neutral-300 text-sm leading-relaxed">{children}</li>,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      code: ({ inline, children }) => 
        inline ? (
          <code className="bg-neutral-700 px-1 py-0.5 rounded text-xs text-neutral-200 font-mono">
            {children}
          </code>
        ) : (
          <code className="block bg-neutral-800 p-3 rounded-lg text-sm text-neutral-200 font-mono overflow-x-auto">
            {children}
          </code>
        ),
      pre: ({ children }) => <div className="mb-4">{children}</div>,
      strong: ({ children }) => <strong className="font-semibold text-neutral-200">{children}</strong>,
      em: ({ children }) => <em className="italic text-neutral-200">{children}</em>,
      a: ({ href, children }) => (
        <a 
          href={href} 
          className="text-blue-400 hover:text-blue-300 underline" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          {children}
        </a>
      ),
      blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-neutral-600 pl-4 my-4 text-neutral-400 italic">
          {children}
        </blockquote>
      ),
    }}
  >
    {content}
  </ReactMarkdown>
);

interface GPTProps {
  message: string;
  onResponseChange?: (response: string) => void;
}

export default function GPT({ message, onResponseChange }: GPTProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string | null>(null);
  const [showMore, setShowMore] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (message.trim()) {
      setLoading(true);
      setResponse(""); // Clear previous response
      setShowMore(false); // Reset show more when new message comes
      
      const fetchData = async () => {
        try {
          const result = await fetch('/api/gpt', {
            method: 'POST',
            body: JSON.stringify({ content: message }),
            headers: {
              'Content-Type': 'application/json',
            },
          });
          const data = await result.json();
          const responseText = data.result || data.error || "No response received";
          setResponse(responseText);
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          onResponseChange && onResponseChange(responseText);
          console.log("GPT response:", responseText);
        } catch (error) {
          console.error('Error fetching GPT response:', error);
          const errText = "Error connecting to ChatGPT API";
          setResponse(errText);
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          onResponseChange && onResponseChange(errText);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [message]);

  const handleCopy = async () => {
    if (response) {
      try {
        await navigator.clipboard.writeText(response);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  const getFirstLine = (text: string) => {
    if (!text) return "";
    const firstSentence = text.split(/[.?]/)[0];
    return firstSentence.length > 100 ? text.substring(0, 100) + "..." : firstSentence + ".";
  };

  return (
    <Card className={showMore ? "max-w-2xl" : "max-w-md"}>
      {!showMore ? (
        <>
          <CardSkeletonContainer>
            <Skeleton />
          </CardSkeletonContainer>
          <CardTitle>ChatGPT</CardTitle>
          <CardDescription>
            {loading ? (
              "Generating response..."
            ) : response ? (
              <div className="space-y-2">
                <span>{getFirstLine(response)}</span>
                <button
                  onClick={() => setShowMore(true)}
                  className="text-blue-400 hover:text-blue-300 text-xs font-medium underline block"
                >
                  Show more
                </button>
              </div>
            ) : (
              "Waiting for response..."
            )}
          </CardDescription>
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle>ChatGPT Response</CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors px-2 py-1 rounded border border-neutral-600 hover:border-neutral-500"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => setShowMore(false)}
                className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors px-2 py-1 rounded border border-neutral-600 hover:border-neutral-500"
              >
                Collapse
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-3">
              {response ? <MarkdownRenderer content={response} /> : "No response available"}
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </Card>
  );
}

const Skeleton = () => {
  const scale = [1, 1.1, 1];
  const transform = ["translateY(0px)", "translateY(-4px)", "translateY(0px)"];
  const sequence = [
    [
      ".circle-1",
      {
        scale,
        transform,
      },
      { duration: 0.8 },
    ],
    [
      ".circle-2",
      {
        scale,
        transform,
      },
      { duration: 0.8 },
    ],
    [
      ".circle-3",
      {
        scale,
        transform,
      },
      { duration: 0.8 },
    ],
    [
      ".circle-4",
      {
        scale,
        transform,
      },
      { duration: 0.8 },
    ],
  ];

  useEffect(() => {
    animate(sequence, {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      repeat: Infinity,
      repeatDelay: 1,
    });
  }, []);

  return (
    <div className="p-8 overflow-hidden h-full relative flex items-center justify-center">
      <div className="flex flex-row flex-shrink-0 justify-center items-center gap-2">
        <Container className="circle-3">
          <OpenAILogo className="h-8 w-8 dark:text-white" />
        </Container>
      </div>
      <div className="w-10 h-32 top-1/2 -translate-y-1/2 absolute -left-10"></div>
    </div>
  );
};

export const Card = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "max-w-md w-full mx-auto p-4 rounded-2xl bg-stone-900/60 hover:bg-stone-900/80 shadow-lg group transition-all duration-300",
        className
      )}
    >
      {children}
    </div>
  );
};
  
export const CardSkeletonContainer = ({
  className,
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showGradient = true,
}: {
  className?: string;
  children: React.ReactNode;
  showGradient?: boolean;
}) => {
  return (
    <div
      className={cn(
        "h-[6rem] md:h-[8rem] rounded-md z-40 overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
};

const Container = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        `h-10 w-10 rounded-full flex items-center justify-center bg-[rgba(248,248,248,0.01)]
    shadow-[0px_0px_8px_0px_rgba(248,248,248,0.25)_inset,0px_32px_24px_-16px_rgba(0,0,0,0.40)]
    `,
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h3
      className={cn(
        "text-sm font-semibold text-neutral-200 dark:text-white py-1",
        className
      )}
    >
      {children}
    </h3>
  );
};

export const CardDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p
      className={cn(
        "text-xs font-normal text-neutral-300 dark:text-neutral-400 max-w-md",
        className
      )}
    >
      {children}
    </p>
  );
};

export const OpenAILogo = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("w-6 h-6", className)}
    >
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4947zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1683a.0757.0757 0 0 1-.071 0l-4.8303-2.7866A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.5973 8.3829l2.02-1.1636a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4947 4.4947 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4022-.5862zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1635a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.6069 1.4997-2.602-1.4997z"/>
    </svg>
  );
};