import { useNavigate } from 'react-router-dom';
import { Wand2, Layers, Zap, Share2, Smartphone, ShieldCheck, type LucideIcon } from 'lucide-react';

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-dvh bg-zinc-950 text-white overflow-x-hidden selection:bg-blue-500/30">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Wand2 size={18} className="text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Zigmage</span>
                    </div>
                    <button
                        onClick={() => navigate('/editor')}
                        className="px-5 py-2 bg-white text-zinc-950 font-semibold rounded-full hover:bg-zinc-200 transition-colors text-sm"
                    >
                        Open Editor
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-125 bg-blue-600/20 rounded-full blur-[120px] -z-10 opacity-50 pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 mb-8 animate-fade-in-up">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-medium text-zinc-400">v1.0 Now Available</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-linear-to-b from-white to-zinc-500 leading-[1.1]">
                        Professional Image Editing, <br />
                        <span className="text-white">Reimagined for Web.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Experience the power of desktop-class editing tools right in your browser.
                        Powered by WebGL and WebAssembly for blazing fast performance.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('/editor')}
                            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Zap size={20} />
                            Start Editing Now
                        </button>
                        <button className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-2xl border border-zinc-800 transition-all hover:scale-105 active:scale-95">
                            View Features
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 px-6 bg-zinc-900/30">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Layers}
                            title="Advanced Layering"
                            description="Non-destructive editing with powerful layer management and blending modes."
                        />
                        <FeatureCard
                            icon={Smartphone}
                            title="Mobile First"
                            description="Designed from the ground up for touch devices with a responsive, fluid interface."
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Privacy Focused"
                            description="All processing happens locally in your browser. Your images never leave your device."
                        />
                        <FeatureCard
                            icon={Wand2}
                            title="Smart Presets"
                            description="Apply professional looks instantly with our curated collection of presets."
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Lightning Fast"
                            description="Built with Rust and WebAssembly for near-native performance on any device."
                        />
                        <FeatureCard
                            icon={Share2}
                            title="Easy Export"
                            description="Export your masterpieces in high quality formats ready for social media."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-zinc-900 bg-zinc-950">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <Wand2 size={20} className="text-zinc-500" />
                        <span className="font-bold text-zinc-500">Zigmage</span>
                    </div>
                    <p className="text-sm text-zinc-600">
                        © 2025 Zigmage. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, description }: { icon: LucideIcon, title: string, description: string }) => (
    <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors group">
        <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Icon size={24} className="text-blue-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-zinc-400 leading-relaxed">
            {description}
        </p>
    </div>
);
