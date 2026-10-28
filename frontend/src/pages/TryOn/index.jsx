import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, Upload, RefreshCw, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { tryOnApi } from '../../services/tryOnApi';

export default function TryOnPage() {
  const [searchParams] = useSearchParams();
  const initialClothingUrl = searchParams.get('clothingUrl') || '';

  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [personImage, setPersonImage] = useState(null); // File object
  const [personPreview, setPersonPreview] = useState(null);
  const [clothingImage, setClothingImage] = useState(null); // File object
  const [clothingPreview, setClothingPreview] = useState(initialClothingUrl);
  
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [error, setError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Attach stream to video element once mounted in DOM
  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.error('Error playing video stream:', err);
      });
    }
  }, [cameraActive, stream]);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Start Camera Stream
  const startCamera = async () => {
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 600 }, height: { ideal: 800 }, facingMode: 'user' }
      });
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err) {
      console.error(err);
      setError('Unable to access camera. Please grant camera permissions in your browser or upload an image file.');
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Capture Frame from Video
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 600;
    canvas.height = video.videoHeight || 800;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' });
        setPersonImage(file);
        setPersonPreview(URL.createObjectURL(file));
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const handlePersonFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPersonImage(file);
      setPersonPreview(URL.createObjectURL(file));
      stopCamera();
    }
  };

  const handleClothingFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setClothingImage(file);
      setClothingPreview(URL.createObjectURL(file));
    }
  };

  const handleRunTryOn = async () => {
    if (!personImage) {
      setError('Please take a photo or upload a full-body person image.');
      return;
    }
    if (!clothingImage && !clothingPreview) {
      setError('Please upload a clothing image.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      let cFile = clothingImage;
      if (!cFile && clothingPreview) {
        const response = await fetch(clothingPreview);
        const blob = await response.blob();
        cFile = new File([blob], 'clothing.jpg', { type: 'image/jpeg' });
      }

      const res = await tryOnApi.virtualTryOn(personImage, cFile);
      if (res.status === 'COMPLETED' && res.resultImageUrl) {
        setResultImage(res.resultImageUrl);
      } else {
        setError(res.errorMessage || 'Virtual try-on processing failed.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error connecting to Python AI Try-On service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-pink-700 text-xs font-semibold border border-pink-200">
          <Sparkles className="w-4 h-4" /> Computer Vision Pose Fitting
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AI Virtual Try-On Room</h1>
        <p className="text-slate-500 text-sm">
          Snap a photo with your webcam or upload a full-body picture to see how your selected outfit looks in real time.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center gap-2 max-w-2xl mx-auto font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Fitting Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Step 1: Person Camera / Photo */}
        <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Camera className="w-5 h-5 text-brand-600" />
              <span>1. Person Photo</span>
            </h3>

            <div className="aspect-[3/4] w-full bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden relative flex items-center justify-center">
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : personPreview ? (
                <img src={personPreview} alt="Person" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-3 p-4">
                  <Camera className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">Open webcam or upload your photo</p>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {cameraActive ? (
              <div className="flex gap-2">
                <button
                  onClick={capturePhoto}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition shadow-sm"
                >
                  Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="px-3 py-2.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={startCamera}
                  className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:border-brand-500 transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Camera className="w-4 h-4" /> Open Camera
                </button>
                <label className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:border-brand-500 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
                  <Upload className="w-4 h-4" /> Upload
                  <input type="file" accept="image/*" onChange={handlePersonFileUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Clothing Selection */}
        <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-accent-purple" />
              <span>2. Clothing Item</span>
            </h3>

            <div className="aspect-[3/4] w-full bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden relative flex items-center justify-center">
              {clothingPreview ? (
                <img src={clothingPreview} alt="Clothing" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-3 p-4">
                  <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">Select apparel item image</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <label className="w-full py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:border-accent-purple transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
              <Upload className="w-4 h-4" /> Upload Clothing Image
              <input type="file" accept="image/*" onChange={handleClothingFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Step 3: Resulting Try-On Output */}
        <div className="glass-panel p-6 rounded-3xl space-y-4 border border-pink-200 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-accent-pink" />
              <span>3. Fitted Result</span>
            </h3>

            <div className="aspect-[3/4] w-full bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden relative flex items-center justify-center">
              {loading ? (
                <div className="text-center space-y-3 p-4">
                  <RefreshCw className="w-8 h-8 text-accent-pink animate-spin mx-auto" />
                  <p className="text-xs text-slate-700 font-semibold">Running pose estimation & neural fitting...</p>
                </div>
              ) : resultImage ? (
                <img src={resultImage} alt="Try-on result" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-3 p-4 text-slate-400">
                  <Sparkles className="w-10 h-10 mx-auto" />
                  <p className="text-xs text-slate-500">Resulting preview will appear here</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleRunTryOn}
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-accent-pink via-accent-purple to-brand-600 text-white font-semibold text-sm shadow-glow-accent hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? 'Processing Virtual Try-On...' : 'Generate Virtual Try-On'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
