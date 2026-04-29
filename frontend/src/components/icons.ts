import {
  Globe, Server, Monitor, HardDrive, Camera, Shield, Wifi, Router,
  Database, Cloud, Cpu, Terminal, Code, Github, Settings, Lock,
  Home, Film, Music, BookOpen, Mail, MessageSquare, Share2, Radio,
  Rss, Palette, Box, Layers, Map, Navigation, Headphones, Smartphone,
  Laptop, Keyboard, Mouse, Printer, Tv, Watch, Zap, Activity,
  FileText, FolderOpen, Archive, Bookmark, Compass, Eye, Key, Wrench
} from 'lucide-react'
import { ComponentType } from 'react'

interface IconDef {
  icon: ComponentType<any>
  label: string
}

export const BUILTIN_ICONS: Record<string, IconDef> = {
  globe:      { icon: Globe,       label: '通用' },
  server:     { icon: Server,      label: '服务器' },
  monitor:    { icon: Monitor,     label: '电脑' },
  harddrive:  { icon: HardDrive,   label: '硬盘/NAS' },
  camera:     { icon: Camera,      label: '摄像头' },
  shield:     { icon: Shield,      label: '安全/防火墙' },
  wifi:       { icon: Wifi,        label: 'WiFi' },
  router:     { icon: Router,      label: '路由器' },
  database:   { icon: Database,    label: '数据库' },
  cloud:      { icon: Cloud,       label: '云服务' },
  cpu:        { icon: Cpu,         label: '硬件/CPU' },
  terminal:   { icon: Terminal,    label: '终端/SSH' },
  code:       { icon: Code,        label: '开发工具' },
  github:     { icon: Github,      label: 'GitHub' },
  settings:   { icon: Settings,    label: '配置/管理' },
  lock:       { icon: Lock,        label: '安全/密码' },
  home:       { icon: Home,        label: '智能家居' },
  film:       { icon: Film,        label: '影视' },
  music:      { icon: Music,       label: '音乐' },
  book:       { icon: BookOpen,    label: '文档/知识库' },
  mail:       { icon: Mail,        label: '邮件' },
  chat:       { icon: MessageSquare, label: '聊天/通讯' },
  share:      { icon: Share2,      label: '文件共享' },
  radio:      { icon: Radio,       label: '广播/流媒体' },
  rss:        { icon: Rss,         label: 'RSS/订阅' },
  palette:    { icon: Palette,     label: '设计工具' },
  box:        { icon: Box,         label: 'Docker/容器' },
  layers:     { icon: Layers,      label: 'PVE/虚拟化' },
  map:        { icon: Map,         label: '地图' },
  headphones: { icon: Headphones,  label: '耳机/音频' },
  phone:      { icon: Smartphone,  label: '手机' },
  laptop:     { icon: Laptop,      label: '笔记本' },
  printer:    { icon: Printer,     label: '打印机' },
  tv:         { icon: Tv,          label: '电视/投影' },
  zap:        { icon: Zap,         label: '快速/自动化' },
  activity:   { icon: Activity,    label: '监控/仪表盘' },
  file:       { icon: FileText,    label: '文件/文档' },
  folder:     { icon: FolderOpen,  label: '文件夹' },
  bookmark:   { icon: Bookmark,    label: '书签/收藏' },
  compass:    { icon: Compass,     label: '导航/发现' },
  eye:        { icon: Eye,         label: '监控/查看' },
  key:        { icon: Key,         label: '密钥/认证' },
  wrench:     { icon: Wrench,      label: '工具/维护' },
}

export function getIconComponent(iconKey: string): ComponentType<any> | null {
  if (!iconKey) return null
  if (BUILTIN_ICONS[iconKey]) return BUILTIN_ICONS[iconKey].icon
  return null
}
