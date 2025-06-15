import React from 'react';
// import {useDropzone} from 'react-dropzone';

function DocumentUpload() {
//     const onDrop = useCallback(acceptedFiles => {
//     console.log(acceptedFiles);
//   }, [])

//     const {
//         getRootProps,
//         getInputProps,
//         isDragActive,
//     } = useDropzone({ onDrop })
    
    return (
        <div>
            <h1
            style={{
                textAlign: 'center', 
                marginBottom: '20px', 
                fontFamily: "Consolas",
            }}
            >Upload Health Documents</h1>


        </div>
    );
}

export default DocumentUpload;

//             <div {...getRootProps()}>
//                 <input {...getInputProps()}/>
//                 {
//                     isDragActive ?
//                     <p>Drop the files here ...</p> :
//                     <p>Drag 'n' drop some files here, or click to select files</p>
//                 }

//             </div>

