const fs = require('fs');
const path = require('path');

const rumiDir = 'C:\\Users\\sLyGhosT\\tarot\\public\\assets\\rumi';
const outputDir = 'C:\\Users\\sLyGhosT\\tarot\\public\\assets\\rumi_standard';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const mapping = {
    // Major Arcana (0-21)
    "5880350b-1.jpg": 0,  // Abdal
    "f30a3f4d-1.jpg": 1,  // Büyücü
    "6e2c5a8d-1.jpg": 2,  // Azize
    "f140c047-1.jpg": 3,  // İmparatoriçe
    "c1bfd729-1.jpg": 4,  // İmparator
    "5b667c12-1.jpg": 5,  // Pir
    "ae1800ff-1.jpg": 6,  // Aşıklar
    "d72feac2-1.jpg": 7,  // Küheylan
    "326b7132-1.jpg": 8,  // Adalet
    "500f4847-1.jpg": 9,  // Keşiş
    "58acc82d-1.jpg": 10, // Çarkıfelek
    "bcc9df5a-1.jpg": 11, // Sebat
    "473eb421-1.jpg": 12, // Asılmış Adam
    "c2b7a2a0-1.jpg": 13, // Ölüm
    "619aa74f-1.jpg": 14, // Denge
    "4eb71e2a-1.jpg": 15, // Şeytan
    "5ae9a3c0-1.jpg": 16, // Minare
    "11f90bc8-1.jpg": 17, // Yıldız
    "8e5245aa-1.jpg": 18, // Ay
    "4892b14f-1.jpg": 19, // Güneş
    "9de56e0b-1.jpg": 20, // Hüküm
    "adad385d-1.jpg": 21, // Dünya

    // Wands (Değnekler 22-35)
    "97595cf1-1.jpg": 22, // Ası
    "08b783fb-1.jpg": 23, // 2
    "0680b976-1.jpg": 24, // 3
    "f27ec524-1.jpg": 25, // 4
    "e0ccb689-1.jpg": 26, // 5
    "5377607e-1.jpg": 27, // 6
    "b6930da5-1.jpg": 28, // 7
    "dbf1317a-1.jpg": 29, // 8
    "e186c390-1.jpg": 30, // 9
    "5c7936ed-1.jpg": 31, // 10
    "4eb13855-1.jpg": 32, // Page
    "0bda89ba-1.jpg": 33, // Knight
    "d5cda3ba-1.jpg": 34, // Queen
    "8322b2ec-1.jpg": 35, // King

    // Cups (Kadehlerin 36-49)
    "d09a85cb-1.jpg": 36, // Ası
    "a57dcd77-1.jpg": 37, // 2
    "2155775d-1.jpg": 38, // 3
    "10debbeb-1.jpg": 39, // 4
    "17376898-1.jpg": 40, // 5
    "46dfa8ec-1.jpg": 41, // 6
    "5e1adca6-1.jpg": 42, // 7
    "b3214dc3-1.jpg": 43, // 8
    "f644d26e-1.jpg": 44, // 9
    "112b9b16-1.jpg": 45, // 10
    "f8b755e0-1.jpg": 46, // Page
    "2d3d90d2-1.jpg": 47, // Knight
    "457d02f8-1.jpg": 48, // Queen
    "82c2b546-1.jpg": 49, // King

    // Swords (Kılıçların 50-63)
    "8449f71d-1.jpg": 50, // Ası
    "23fea42b-1.jpg": 51, // 2
    "3b4d0390-1.jpg": 52, // 3
    "15be3967-1.jpg": 53, // 4
    "b278eea9-1.jpg": 54, // 5
    "5bf4ce8f-1.jpg": 55, // 6
    "e4554e55-1.jpg": 56, // 7
    "f9084e0e-1.jpg": 57, // 8
    "377761cb-1.jpg": 58, // 9
    "2d91ea43-1.jpg": 59, // 10
    "3088cdd3-1.jpg": 60, // Page
    "33e5765f-1.jpg": 61, // Knight
    "7d3f8c98-1.jpg": 62, // Queen
    "5d9147f8-1.jpg": 63, // King

    // Pentacles (Dinarların 64-77)
    "24acd0a3-1.jpg": 64, // Ası
    "76ba824e-1.jpg": 65, // 2
    "25dd216d-1.jpg": 66, // 3
    "65154141-1.jpg": 67, // 4
    "9a3deaa3-1.jpg": 68, // 5
    "850d8fc9-1.jpg": 69, // 6
    "69e84869-1.jpg": 70, // 7
    "67aaa019-1.jpg": 71, // 8
    "b46f8070-1.jpg": 72, // 9
    "d675da47-1.jpg": 73, // 10
    "13771832-1.jpg": 74, // Page
    "bc3daf23-1.jpg": 75, // Knight
    "780e5997-1.jpg": 76, // Queen
    "7d851754-1.jpg": 77, // King
};

Object.keys(mapping).forEach(oldName => {
    const newName = `${mapping[oldName]}.jpg`;
    const oldPath = path.join(rumiDir, oldName);
    const newPath = path.join(outputDir, newName);

    if (fs.existsSync(oldPath)) {
        fs.copyFileSync(oldPath, newPath);
        console.log(`Copied ${oldName} to ${newName}`);
    } else {
        console.warn(`File not found: ${oldName}`);
    }
});
