const dotenv = require("dotenv");
const { MezonClient } = require("mezon-sdk");
const http = require("http");
const https = require("https");
const url = require("url");

dotenv.config();

async function fetchPunishmentComparison(username) {
  return new Promise((resolve, reject) => {
    try {
      const apiUrl = `https://stg-api-timesheet.nccsoft.vn/api/services/app/UserPunishment/GetCompanyPunishmentComparisonAsync?username=${encodeURIComponent(username)}`;
      
      const parsedUrl = url.parse(apiUrl);
      const securityCode = process.env.TIMESHEET_SECURITY_CODE;

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.path,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Secret-Key': securityCode || '',
          'User-Agent': 'Mezon-Bot/1.0'
        },
        ...(parsedUrl.protocol === 'https:' ? { agent: new https.Agent({ rejectUnauthorized: false }) } : {})
      };
      
      const httpModule = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = httpModule.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
            const redirectUrl = res.headers.location;
            
            const redirectParsedUrl = url.parse(redirectUrl);
            
            const redirectOptions = {
              hostname: redirectParsedUrl.hostname,
              port: redirectParsedUrl.port || (redirectParsedUrl.protocol === 'https:' ? 443 : 80),
              path: redirectParsedUrl.path,
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'X-Secret-Key': securityCode || '',
                'User-Agent': 'Mezon-Bot/1.0'
              },
              ...(redirectParsedUrl.protocol === 'https:' ? { agent: new https.Agent({ rejectUnauthorized: false }) } : {})
            };
            
            const redirectHttpModule = redirectParsedUrl.protocol === 'https:' ? https : http;
            
            const redirectReq = redirectHttpModule.request(redirectOptions, (redirectRes) => {
              let redirectData = '';
              
              redirectRes.on('data', (chunk) => {
                redirectData += chunk;
              });
              
              redirectRes.on('end', () => {
                if (redirectRes.statusCode >= 200 && redirectRes.statusCode < 300) {
                  try {
                    const parsedData = JSON.parse(redirectData);
                    
                    if (!parsedData.success) {
                      reject(new Error(`API returned error after redirect: ${parsedData.error?.message || 'Unknown error'}`));
                      return;
                    }
                    
                    resolve(parsedData.result);
                  } catch (e) {
                    reject(new Error(`Error parsing redirect JSON response: ${e.message}`));
                  }
                } else {
                  reject(new Error(`Redirect API request failed with status ${redirectRes.statusCode}`));
                }
              });
            });
            
            redirectReq.on('error', (error) => {
              reject(error);
            });
            
            redirectReq.end();
            return;
          }
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsedData = JSON.parse(data);

              if (!parsedData.success) {
                reject(new Error(`API returned error: ${parsedData.error?.message || 'Unknown error'}`));
                return;
              }
              
              resolve(parsedData.result);
            } catch (e) {
              reject(new Error(`Error parsing JSON response: ${e.message}`));
            }
          } else if (res.statusCode === 401) {
            reject(new Error('Unauthorized: Invalid security code'));
          } else {
            reject(new Error(`API request failed with status ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

function formatPunishmentComparisonTable(data) {
  const BAR_LENGTH = 16;
  const BAR_CHAR = "█";

  const significantPunishments = data.punishmentDetails.filter(item => 
    item.companyBarPercentage > 0 || item.userBarPercentage > 0
  );

  significantPunishments.sort((a, b) => {
    if (a.punishmentType === "NoCheckInAndNoCheckOut" && b.punishmentType !== "NoCheckInAndNoCheckOut") return 1;
    if (a.punishmentType !== "NoCheckInAndNoCheckOut" && b.punishmentType === "NoCheckInAndNoCheckOut") return -1;

    if (a.userBarPercentage !== b.userBarPercentage) {
      return b.userBarPercentage - a.userBarPercentage;
    }
    return b.companyBarPercentage - a.companyBarPercentage;
  });

  const topPunishments = significantPunishments;

  let output = `📊 Tỷ lệ phạt (${data.month}/${data.year})\n\n`;

  const userTotalPercent = Math.round(data.totalBarPercentage.user);
  const companyTotalPercent = Math.round(data.totalBarPercentage.company);
  
  const userTotalBlocks = Math.round((userTotalPercent * BAR_LENGTH) / 100);
  const companyTotalBlocks = Math.round((companyTotalPercent * BAR_LENGTH) / 100);
  
  const userTotalBar = BAR_CHAR.repeat(userTotalBlocks).padEnd(BAR_LENGTH, " ");
  const companyTotalBar = BAR_CHAR.repeat(companyTotalBlocks).padEnd(BAR_LENGTH, " ");
  
  output += `Tổng cộng:\n`;
  output += `- Bạn         [${userTotalBar}] ${userTotalPercent}%\n`;
  output += `- Công ty  [${companyTotalBar}] ${companyTotalPercent}%\n\n`;

  topPunishments.forEach((item) => {
    const userPercent = Math.round(item.userBarPercentage);
    const companyPercent = Math.round(item.companyBarPercentage);
    
    const userBlocks = Math.round((userPercent * BAR_LENGTH) / 100);
    const companyBlocks = Math.round((companyPercent * BAR_LENGTH) / 100);
    
    const userBar = BAR_CHAR.repeat(userBlocks).padEnd(BAR_LENGTH, " ");
    const companyBar = BAR_CHAR.repeat(companyBlocks).padEnd(BAR_LENGTH, " ");
    
    output += `${item.punishmentType}:\n`;
    output += `- Bạn         [${userBar}] ${userPercent}%\n`;
    output += `- Công ty  [${companyBar}] ${companyPercent}%\n\n`;
  });

  return output.trim();
}

async function main() {
  const client = new MezonClient(process.env.APPLICATION_TOKEN);

  await client.login();

  client.onChannelMessage(async (event) => {
    if (event?.content?.t === "*ping") {
      const channelFetch = await client.channels.fetch(event.channel_id);
      const messageFetch = await channelFetch.messages.fetch(event.message_id);

      await messageFetch.reply({ t: 'reply pong' });

      await channelFetch.send({ t: 'channel send pong' });

      const clan = await client.clans.fetch(event.clan_id);
      const user = await clan.users.fetch(event.sender_id);
      await user.sendDM({ t: 'hello DM' });
    }

    if (event?.content?.t === "*comparefine") {
      const channelFetch = await client.channels.fetch(event.channel_id);
      const messageFetch = await channelFetch.messages.fetch(event.message_id);
      
      try {
        const clan = await client.clans.fetch(event.clan_id);
        const user = await clan.users.fetch(event.sender_id);

        await messageFetch.reply({ t: "\u23F3 Đang tải dữ liệu phạt..." });

        const username = user.username;
        if (!username) {
          throw new Error("Username not available");
        }
        
        const punishmentData = await fetchPunishmentComparison(username);

        const formattedBarChart = formatPunishmentComparisonTable(punishmentData);

        const userInfo = `Người dùng: ${username}`;
        await messageFetch.reply({ t: `${userInfo}\n\n${formattedBarChart}` });
      } catch (error) {
        await messageFetch.reply({ t: `\u274C Có lỗi xảy ra khi lấy dữ liệu phạt: ${error.message}. Vui lòng thử lại sau.` });
      }
    }
  });
}

main()
  .then(() => {})
  .catch(() => {});

module.exports = {
  fetchPunishmentComparison,
  formatPunishmentComparisonTable
};