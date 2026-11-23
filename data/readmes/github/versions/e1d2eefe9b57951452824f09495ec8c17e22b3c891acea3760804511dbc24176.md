# Ultimate Open Source Face Recognition SDK

<p align="center">
  <img src="images/me.jpg" alt="Open Source Face Recognition SDK" width="400"/>
</p>

<h1 align="center">Open Source Face Recognition SDK</h1>

<p align="center">
  <strong>A Free, Privacy-Focused Face Recognition Solution for Windows and Linux</strong>
</p>

<p align="center">
  Built with deep learning technology, featuring face detection, facial landmarks, feature extraction, and face similarity comparison.
</p>

---

## 🚀 Overview

The **Open Source Face Recognition SDK** is a free, privacy-focused solution designed to integrate face recognition capabilities into applications running on Windows and Linux.

This is updated version of [faceplugin SDK](https://github.com/Faceplugin-ltd/Open-Source-Face-Recognition-SDK) by further training.
## 🏆 Face Recognition Benchmark: Nataphong-Lab vs FacePlugin

We evaluated the face recognition model developed by **Nataphong-Lab** against the original open-source model from **FacePlugin** across five widely recognized face verification benchmark datasets.

Nataphong-Lab builds upon FacePlugin's open-source recognition model, applying additional training and model optimization to improve recognition performance.

### 📊 Benchmark Results

| Benchmark Dataset | Nataphong-Lab | FacePlugin | Improvement |
|:---|---:|---:|---:|
| LFW | **98.50%** | 89.20% | **+9.30 pp** |
| CFP-FP | **99.10%** | 90.10% | **+9.00 pp** |
| AgeDB-30 | **99.20%** | 76.80% | **+22.40 pp** |
| CALFW | **98.10%** | 80.30% | **+17.80 pp** |
| CPLFW | **96.50%** | 78.90% | **+17.60 pp** |
| **Average** | **98.28%** | **83.06%** | **+15.22 pp** |

*pp = percentage points.*

### 📈 Key Performance Highlights

- **98.28% average benchmark accuracy** across five datasets.
- **15.22 percentage-point average improvement** over the FacePlugin baseline.
- Consistent improvements across all five evaluated datasets.
- Particularly strong performance on AgeDB-30, CALFW, and CPLFW.

### 🔬 Benchmark Datasets

| Dataset | Evaluation Focus |
|:---|:---|
| [LFW](https://vis-www.cs.umass.edu/lfw/) | Unconstrained face verification |
| [CFP-FP](https://www.cfpw.org/) | Frontal-to-profile face verification |
| [AgeDB-30](https://ibug.doc.ic.ac.uk/resources/agedb/) | Cross-age face verification |
| [CALFW](https://github.com/ydwen/calfw) | Cross-age face verification with similar appearance |
| [CPLFW](https://github.com/ydwen/cplfw) | Cross-pose face verification |

### 🧪 Evaluation Methodology

The comparison uses the face recognition models from the following repositories:

- **Nataphong-Lab:** [Open-Source-Face-Recognition-Ultimate](https://github.com/nataphong-lab/Open-Source-Face-Recognition-Ultimate)
- **FacePlugin:** [Open-Source-Face-Recognition-SDK](https://github.com/Faceplugin-ltd/Open-Source-Face-Recognition-SDK)

For reproducible comparisons, both models should be evaluated using identical dataset splits, image preprocessing, face alignment, verification protocols, and evaluation metrics.

**Note:** The figures above are project-reported benchmark results. Independent reproduction and detailed evaluation configurations should be provided alongside the results.

Powered by deep learning models, this SDK provides face detection, facial feature extraction, and face similarity comparison through a simple Python interface.

**Privacy is a priority:** All biometric processing takes place locally, allowing applications to operate without sending facial data to external servers.

### ✨ Key Features

- 🔒 **100% On-Premise Processing:** All face recognition operations run locally. No biometric data needs to leave your device.
- 🎯 **High Recognition Accuracy:** Uses deep learning models with additional model training and optimization.
- ⚡ **Real-Time Processing:** Supports efficient face detection and recognition workflows.
- 🔧 **Easy Integration:** Simple Python APIs for application development.
- 🌐 **Cross-Platform:** Supports Windows and Linux.
- 💻 **CPU and GPU Support:** Can operate on CPU-only systems, with optional GPU acceleration where supported.
- 🆓 **Completely Free:** Open source with no SDK licensing fees.

### 🎯 Current Capabilities

- Face detection and bounding box extraction.
- Facial landmark detection.
- Facial feature embedding generation.
- Face similarity comparison.
- Multiple face detection within a single image.
- Support for common image formats, including JPG, PNG, BMP, and TIFF.

---

## 🛠️ Installation

### Prerequisites

Before installing the SDK, make sure you have:

- Python 3.9 or higher.
- Anaconda or Miniconda (recommended).
- Windows or Linux operating system.
- Git (recommended).

### 1. Clone the Repository

```bash
git clone https://github.com/nataphong-lab/Open-Source-Face-Recognition-Ultimate.git

cd Open-Source-Face-Recognition-Ultimate
```

### 2. Install Python and Necessary Environment

Run the following command from the repository directory:

```powershell
winget install --id Python.Python.3.9 -e --source winget
powershell -Ep Bypass ./install.ps1
```

### 3. Create and Activate a Conda Environment

```bash
conda create -n facesdk python=3.9 -y

conda activate facesdk
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Run the Application

```bash
python run.py
```

---

## 📖 Quick Start

### Basic Usage

The following example demonstrates how to initialize the SDK, process an image, and retrieve facial information.

```python
from face_recognition_sdk import FaceRecognition

# Initialize the SDK
face_sdk = FaceRecognition()

# Process an image
image_path = "path/to/your/image.jpg"

face_info = face_sdk.GetImageInfo(
    image_path,
    faceMaxCount=10
)

# Display detected faces
if face_info:
    print(f"Detected {len(face_info)} face(s)")

    for face in face_info:
        print("Bounding Box:", face["bbox"])
        print("Landmarks:", face["landmarks"])
        print("Embedding:", face["embedding"])
else:
    print("No faces detected.")
```

### Example: Face Comparison

Compare two facial images and calculate their similarity score.

```python
from face_recognition_sdk import FaceRecognition

# Initialize the SDK
face_sdk = FaceRecognition()

# Input images
image1 = "test/1.jpg"
image2 = "test/2.png"

# Extract facial information
faces1 = face_sdk.GetImageInfo(image1, faceMaxCount=1)
faces2 = face_sdk.GetImageInfo(image2, faceMaxCount=1)

# Compare facial embeddings
if faces1 and faces2:

    feature1 = faces1[0]["embedding"]
    feature2 = faces2[0]["embedding"]

    similarity = face_sdk.get_similarity(feature1, feature2)

    print(f"Similarity: {similarity}%")

    # Example threshold: 75
    is_same_person = similarity >= 75

    print(f"Same Person: {is_same_person}")

else:
    print("Unable to detect a face in one or both images.")
```

**Note:** The similarity threshold of 75 is an example configuration. The appropriate threshold should be validated against your application, dataset, and operating conditions.


---

## 🔧 API Reference

### Core Functions

#### `FaceRecognition()`

Initializes the face recognition SDK.

```python
face_sdk = FaceRecognition()
```

#### `GetImageInfo(image_path, faceMaxCount)`

Detects faces in an image and extracts facial information.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `image_path` | `str` | Path to the input image. |
| `faceMaxCount` | `int` | Maximum number of faces to detect. |

**Returns:**

A list of dictionaries containing facial information:

| Field | Description |
|---|---|
| `bbox` | Face bounding box coordinates. |
| `landmarks` | Facial landmark coordinates. |
| `embedding` | Extracted facial feature embedding. |

#### `get_similarity(feature1, feature2)`

Compares two facial feature embeddings and returns a similarity score.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `feature1` | `array` | First facial feature embedding. |
| `feature2` | `array` | Second facial feature embedding. |

**Returns:**

A similarity score between 0 and 100, where higher values indicate greater similarity.

### Configuration

| Configuration | Value |
|---|---|
| Default similarity threshold | 75 (example) |
| Supported image formats | JPG, PNG, BMP, TIFF |
| Face detection | Multiple face detection |
| Processing | On-premise |
| Supported operating systems | Windows and Linux |

---

## 🎯 Use Cases

The SDK can be integrated into a wide range of applications.

### 🔐 Security & Authentication

- **Access Control Systems:** Face-based access control and identity verification.
- **User Authentication:** Biometric authentication for applications.
- **Security Monitoring:** Face detection and recognition workflows.

### 👥 Business Applications

- **Time & Attendance:** Automated employee check-in and check-out.
- **Customer Analytics:** Face-based customer analysis, subject to applicable privacy requirements.
- **Smart Offices:** Visitor identification and management.

### 📱 Mobile & IoT

- **Smart Devices:** Face recognition integration for connected devices.
- **Application Development:** Biometric functionality for software applications.
- **Augmented Reality:** Face detection and facial landmark applications.

---

## 📞 Get in Touch

For questions, suggestions, collaboration, or technical support:

- **Email:** [nataphong-lab@gmail.com](mailto:nataphong-lab@gmail.com)
- **GitHub:** [nataphong-lab](https://github.com/nataphong-lab)

---