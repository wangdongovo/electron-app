import React, { useState, useEffect } from "react";
import {
  Monitor,
  CheckCircle2,
  MoreVertical,
  Terminal,
  Github,
  Database,
  Copy,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";

interface EnvInfo {
  deviceId: string;
  software: {
    node: string | null;
    git: string | null;
    mysql: string | null;
  };
}

const EnvDetection: React.FC = () => {
  const [info, setInfo] = useState<EnvInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchEnv = async () => {
    setLoading(true);
    try {
      const data = await (window as any).electron.getSystemEnv();
      setInfo(data);
    } catch (err) {
      console.error("Failed to fetch env:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnv();
  }, []);

  const copyId = () => {
    if (info?.deviceId) {
      navigator.clipboard.writeText(info.deviceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const softwareData = [
    {
      id: "node",
      name: "Node.js",
      role: "Development",
      roleDetail: "Runtime",
      version: info?.software.node,
      icon: <Terminal className="w-5 h-5 text-zinc-500" />,
      fallback: "N",
      url: "https://nodejs.org/",
    },
    {
      id: "git",
      name: "Git",
      role: "Development",
      roleDetail: "Version Control",
      version: info?.software.git,
      icon: <Github className="w-5 h-5 text-zinc-500" />,
      fallback: "G",
      url: "https://git-scm.com/",
    },
    {
      id: "mysql",
      name: "MySQL",
      role: "Database",
      roleDetail: "Management",
      version: info?.software.mysql,
      icon: <Database className="w-5 h-5 text-zinc-500" />,
      fallback: "M",
      url: "https://dev.mysql.com/downloads/",
    },
  ];

  const getStatusBadge = (version: string | null) => {
    if (version) {
      return (
        <div className="flex items-center gap-2 text-zinc-600 font-medium">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          Active
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-zinc-400 font-medium">
        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
        Missing
      </div>
    );
  };

  if (loading && !info) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4 animate-in fade-in duration-500">
        <RefreshCw className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-zinc-500 font-medium tracking-wide">
          Initializing environment detection...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header with Device ID */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
            <ShieldCheck className="text-indigo-600 w-8 h-8" />
            Environment Setup
          </h1>
          <div className="mt-2 flex items-center gap-2 text-zinc-500 group cursor-default">
            <Monitor size={16} />
            <span className="text-sm font-medium">Device ID:</span>
            <span className="text-sm font-mono bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
              {info?.deviceId || "detecting..."}
            </span>
            <button
              onClick={copyId}
              className="p-1 hover:bg-zinc-200 rounded transition-colors"
              title="Copy ID"
            >
              {copied ? (
                <CheckCircle2 size={14} className="text-emerald-500" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={fetchEnv}
          className="rounded-xl border-zinc-200 hover:border-indigo-200 hover:bg-indigo-50/50 text-zinc-600 hover:text-indigo-600 transition-all shadow-sm"
        >
          <RefreshCw
            size={16}
            className={`mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh Status
        </Button>
      </div>

      {/* Main Table Card */}
      <Card className="border-zinc-200/60 shadow-xl shadow-zinc-200/20 overflow-hidden rounded-[24px]">
        <Table>
          <TableHeader className="bg-zinc-50/50 border-none">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[350px] font-bold text-zinc-400 uppercase text-[11px] tracking-widest pl-8 py-5">
                Name
              </TableHead>
              <TableHead className="font-bold text-zinc-400 uppercase text-[11px] tracking-widest py-5">
                Role
              </TableHead>
              <TableHead className="font-bold text-zinc-400 uppercase text-[11px] tracking-widest py-5">
                Status
              </TableHead>
              <TableHead className="font-bold text-zinc-400 uppercase text-[11px] tracking-widest py-5 text-right pr-8">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {softwareData.map((item) => (
              <TableRow
                key={item.id}
                className="group hover:bg-zinc-50/30 transition-colors border-zinc-100"
              >
                <TableCell className="pl-8 py-5">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 rounded-full border border-zinc-100 shadow-sm transition-transform group-hover:scale-105">
                      <AvatarFallback className="bg-zinc-100 text-zinc-400 font-bold uppercase">
                        {item.icon || item.fallback}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-zinc-900 text-base leading-tight">
                        {item.name}
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">
                        {item.version || "Not installed"}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-5">
                  <div className="flex flex-col">
                    <span className="font-bold text-zinc-700 text-sm">
                      {item.role}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium tracking-tight whitespace-nowrap">
                      {item.roleDetail}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-5">
                  {getStatusBadge(item.version)}
                </TableCell>
                <TableCell className="py-5 text-right pr-8">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                      >
                        <MoreVertical size={18} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 rounded-xl border-zinc-200"
                    >
                      <DropdownMenuItem
                        className="gap-2 focus:bg-indigo-50 focus:text-indigo-600 cursor-pointer"
                        onClick={() => window.open(item.url, "_blank")}
                      >
                        <ExternalLink size={14} />
                        Official Site
                      </DropdownMenuItem>
                      {!item.version && (
                        <DropdownMenuItem
                          className="gap-2 focus:bg-emerald-50 focus:text-emerald-600 cursor-pointer text-emerald-600 font-medium"
                          onClick={() => window.open(item.url, "_blank")}
                        >
                          <Download size={14} />
                          Install Now
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default EnvDetection;
