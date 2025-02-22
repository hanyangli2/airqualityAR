// import * as tf from '@tensorflow/tfjs';
// import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
// import * as DeepLab from '@tensorflow-models/deeplab';

// export class SkyDetectionService {
//   private model: DeepLab.SemanticSegmentation | null = null;
//   private isInitialized = false;

//   async initialize(): Promise<void> {
//     try {
//       await tf.ready();
//       this.model = await DeepLab.load({
//         base: 'pascal',
//         quantizationBytes: 2
//       });
//       this.isInitialized = true;
//     } catch (error) {
//       console.error('Failed to initialize SkyDetectionService:', error);
//       throw error;
//     }
//   }

//   async detectSky(imageData: ImageData): Promise<THREE.DataTexture> {
//     if (!this.isInitialized || !this.model) {
//       throw new Error('SkyDetectionService not initialized');
//     }

//     const imageTensor = tf.browser.fromPixels(imageData);
//     const segmentation = await this.model.segment(imageTensor);
//     const skyMask = segmentation.segmentationMap.equal(tf.scalar(2));
//     const maskData = await skyMask.data();

//     return new THREE.DataTexture(
//       new Uint8Array(maskData),
//       segmentation.width,
//       segmentation.height,
//       THREE.LuminanceFormat
//     );
//   }

//   isReady(): boolean {
//     return this.isInitialized;
//   }
// }

// export const skyDetectionService = new SkyDetectionService(); 