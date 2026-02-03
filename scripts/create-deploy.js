import fs from 'fs';

const iifePath = 'dist/iife/index.js';

const createVersion = () => {

    const packageJSONRaw = fs.readFileSync('./package.json', 'utf8');
    const packageJSON = JSON.parse(packageJSONRaw);
    const fullVersion = packageJSON.version;

    let isTestTag = false;
    let tempString = fullVersion;
    let minVersion, majVersion, patVersion, tag, tagVersion;

    majVersion = tempString.slice(0, tempString.indexOf("."));
    tempString = tempString.slice(tempString.indexOf(".")+1);
    minVersion = tempString.slice(0, tempString.indexOf("."));
    tempString = tempString.slice(tempString.indexOf(".")+1);

    if(tempString.indexOf("-") > 0){
        patVersion = tempString.slice(0, tempString.indexOf("-"));
        tag = tempString.slice(tempString.indexOf("-")+1, tempString.indexOf("."));
        tagVersion = tempString.slice(tempString.lastIndexOf(".")+1);
        isTestTag = true;
    } else {
        patVersion = tempString
    }

    const iifeContent = fs.readFileSync(iifePath, 'utf8');

    if(!isTestTag){
        fs.writeFileSync("deploy/"+majVersion+"."+minVersion+"."+patVersion+".min.js", iifeContent, 'utf8');
        fs.writeFileSync("deploy/"+majVersion+"."+minVersion+"-latest.min.js", iifeContent, 'utf8');
        fs.writeFileSync("deploy/"+majVersion+"-latest.min.js", iifeContent, 'utf8');
    } else {
        fs.writeFileSync("deploy/"+majVersion+"."+minVersion+"."+patVersion+"-"+tag+"."+tagVersion+".min.js", iifeContent, 'utf8');
        fs.writeFileSync("deploy/"+majVersion+"."+minVersion+"."+patVersion+"-"+tag+"-latest.min.js", iifeContent, 'utf8');
        fs.writeFileSync("deploy/"+majVersion+"."+minVersion+"-"+tag+"-latest.min.js", iifeContent, 'utf8');
        fs.writeFileSync("deploy/"+majVersion+"-"+tag+"-latest.min.js", iifeContent, 'utf8');
    }

};

createVersion();