export type FeatureModule =
  | "A"
  | "B"
  | "C"
  | "D";


export type AIFeature = {

  id:string;

  name:string;

  module:FeatureModule;

  category:string;

  description:string;

  credit:number;

  multiImage:boolean;

};



export const aiFeatures:AIFeature[] = [


{
id:"image-to-prompt",
name:"Gambar ke Prompt",
module:"A",
category:"Vision AI",
description:"Ubah gambar menjadi prompt AI detail.",
credit:0.2,
multiImage:false
},



{
id:"remove-bg",
name:"Hapus Background",
module:"B",
category:"Edit Cepat",
description:"Menghapus background foto.",
credit:1,
multiImage:false
},


{
id:"retouch",
name:"AI Retouch",
module:"B",
category:"Edit Cepat",
description:"Perbaikan kulit dan detail wajah.",
credit:1,
multiImage:false
},


{
id:"photo-enhance",
name:"Perbaiki Foto",
module:"B",
category:"Edit Cepat",
description:"Restorasi foto lama dan buram.",
credit:1,
multiImage:false
},


{
id:"sketch",
name:"Sketsa AI",
module:"B",
category:"Creative",
description:"Konversi foto menjadi sketsa.",
credit:1,
multiImage:false
},


{
id:"caricature",
name:"Art & Karikatur",
module:"B",
category:"Creative",
description:"Foto menjadi gaya artistik.",
credit:1,
multiImage:false
},


{
id:"anime-real",
name:"Anime To Real",
module:"B",
category:"Creative",
description:"Mengubah anime menjadi realistis.",
credit:1,
multiImage:false
},


{
id:"magic-edit",
name:"AI Edit",
module:"B",
category:"Edit Cepat",
description:"Edit foto berdasarkan instruksi.",
credit:1,
multiImage:false
},


{
id:"change-angle",
name:"Ubah Angle",
module:"B",
category:"Edit Cepat",
description:"Mengubah sudut kamera.",
credit:1,
multiImage:false
},



{
id:"photo-merge",
name:"Gabung Foto",
module:"C",
category:"Professional",
description:"Gabungkan beberapa foto.",
credit:3,
multiImage:true
},


{
id:"face-swap",
name:"Face Swap",
module:"C",
category:"Professional",
description:"Pertukaran wajah dengan referensi.",
credit:3,
multiImage:true
},


{
id:"product-studio",
name:"Product Studio",
module:"C",
category:"Professional",
description:"Foto produk studio profesional.",
credit:3,
multiImage:true
},


{
id:"fashion-ai",
name:"Fashion AI",
module:"C",
category:"Professional",
description:"Mockup fashion menggunakan AI.",
credit:3,
multiImage:true
},


{
id:"mockup",
name:"Product Mockup",
module:"C",
category:"Professional",
description:"Tempel desain ke mockup.",
credit:3,
multiImage:true
},


{
id:"virtual-tryon",
name:"Virtual Try On",
module:"C",
category:"Professional",
description:"Pasangkan pakaian virtual.",
credit:3,
multiImage:true
},


{
id:"pose-change",
name:"Ubah Pose",
module:"C",
category:"Professional",
description:"Mengubah pose manusia.",
credit:3,
multiImage:true
},


{
id:"passport",
name:"Pas Foto AI",
module:"C",
category:"Professional",
description:"Foto formal dokumen.",
credit:3,
multiImage:false
},


{
id:"barber",
name:"Barber Preview",
module:"C",
category:"Professional",
description:"Simulasi gaya rambut.",
credit:3,
multiImage:true
},


{
id:"outpaint",
name:"Perluas Foto",
module:"C",
category:"Professional",
description:"Memperluas area foto.",
credit:3,
multiImage:false
},



{
id:"prewedding",
name:"Pre Wedding AI",
module:"C",
category:"Special Moments",
description:"Foto prewedding AI.",
credit:3,
multiImage:true
},


{
id:"couple",
name:"Potret Cinta",
module:"C",
category:"Special Moments",
description:"Foto pasangan natural.",
credit:3,
multiImage:true
},


{
id:"baby",
name:"Baby Born",
module:"C",
category:"Special Moments",
description:"Newborn studio AI.",
credit:3,
multiImage:false
},


{
id:"child",
name:"Foto Anak",
module:"C",
category:"Special Moments",
description:"Tema foto anak.",
credit:3,
multiImage:false
},


{
id:"umroh",
name:"Umroh & Haji",
module:"C",
category:"Special Moments",
description:"Foto tema religi.",
credit:3,
multiImage:false
},


{
id:"maternity",
name:"Maternity",
module:"C",
category:"Special Moments",
description:"Foto maternity.",
credit:3,
multiImage:false
},



{
id:"banner",
name:"Banner AI",
module:"D",
category:"Marketing",
description:"Banner promosi hybrid AI.",
credit:5,
multiImage:true
},


{
id:"carousel",
name:"Carousel Sosmed",
module:"D",
category:"Marketing",
description:"Carousel Instagram AI.",
credit:5,
multiImage:true
}


];