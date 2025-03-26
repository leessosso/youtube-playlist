import { useEffect, useState } from 'react';
import { initYouTubeAuth, logout } from '../utils/youtubeAuth';
import {
  Box,
  Button,
  Container,
  Heading,
  Select,
  Textarea,
  VStack,
  Text,
  List,
  ListItem,
  Link,
  Alert,
  useToast,
} from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

interface Playlist {
  id: string;
  title: string;
  itemCount: number;
}

interface YouTubeExtractorProps {
  authStatus: boolean;
}

export default function YouTubeExtractor({ authStatus }: YouTubeExtractorProps) {
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [extractedLinks, setExtractedLinks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  const fetchPlaylists = async () => {
    if (!authStatus) return;

    setIsLoadingPlaylists(true);
    try {
      const accessToken = localStorage.getItem('youtube_access_token');
      if (!accessToken) {
        setError('인증 토큰이 없습니다. 다시 로그인해주세요.');
        return;
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50&key=${API_KEY}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('재생목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      const formattedPlaylists = data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        itemCount: item.contentDetails.itemCount,
      }));
      setPlaylists(formattedPlaylists);
    } catch (err) {
      console.error('Error fetching playlists:', err);
      setError('재생목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  useEffect(() => {
    if (authStatus) {
      fetchPlaylists();
    }
  }, [authStatus]);

  const extractLinks = () => {
    const urlRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/g;
    const matches = message.match(urlRegex) || [];
    
    const uniqueLinks = [...new Set(matches)];
    setExtractedLinks(uniqueLinks);
    setError(null);
  };

  const handleUpdatePlaylist = async () => {
    if (!authStatus) {
      setError('재생목록을 업데이트하려면 로그인이 필요합니다.');
      return;
    }

    if (!selectedPlaylistId) {
      setError('재생목록을 선택해주세요.');
      return;
    }

    if (!extractedLinks.length) {
      setError('추출된 링크가 없습니다.');
      return;
    }

    try {
      const accessToken = localStorage.getItem('youtube_access_token');
      if (!accessToken) {
        setError('인증 토큰이 없습니다. 다시 로그인해주세요.');
        return;
      }

      // 기존 재생목록 항목들 가져오기
      setError('기존 재생목록 항목들을 삭제하는 중...');
      let pageToken = '';
      do {
        const listResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=id&playlistId=${selectedPlaylistId}&maxResults=50&pageToken=${pageToken}&key=${API_KEY}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (!listResponse.ok) {
          throw new Error('재생목록 항목을 가져오는데 실패했습니다.');
        }

        const listData = await listResponse.json();
        
        // 각 항목 삭제
        for (const item of listData.items) {
          await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?id=${item.id}&key=${API_KEY}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );
        }

        pageToken = listData.nextPageToken || '';
      } while (pageToken);

      // 새로운 비디오 추가하기
      setError('새로운 영상들을 추가하는 중...');
      const videoIds = extractedLinks.map(link => {
        const url = new URL(link);
        if (url.hostname === 'youtu.be') {
          return url.pathname.slice(1);
        }
        return new URLSearchParams(url.search).get('v');
      }).filter(Boolean);

      const total = videoIds.length;
      let completed = 0;

      for (const videoId of videoIds) {
        try {
          const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&key=${API_KEY}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              snippet: {
                playlistId: selectedPlaylistId,
                resourceId: {
                  kind: 'youtube#video',
                  videoId: videoId
                }
              }
            })
          });

          if (!response.ok) {
            const error = await response.json();
            console.error(`Error adding video ${videoId}:`, error);
            if (error.error?.code === 401) {
              setError('인증이 만료되었습니다. 다시 로그인해주세요.');
              logout();
              return;
            }
            continue;
          }

          completed++;
          setError(`진행 중: ${completed}/${total}`);
        } catch (err) {
          console.error(`Error adding video ${videoId}:`, err);
        }
      }

      setError(null);
      toast({
        title: '성공',
        description: `${completed}개의 동영상이 재생목록에 추가되었습니다!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // 재생목록 목록 새로고침 (1.5초 지연 후)
      setTimeout(async () => {
        await fetchPlaylists();
        // 입력 필드와 추출된 링크 초기화
        setMessage('');
        setExtractedLinks([]);
        toast({
          title: '재생목록 업데이트 완료',
          description: '재생목록이 새로고침되었습니다.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }, 1500);
      
    } catch (err) {
      console.error('Error updating playlist:', err);
      setError('재생목록 업데이트 중 오류가 발생했습니다.');
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" py={8} px={4}>
      <Container maxW="container.xl">
        <Box bg="white" rounded="lg" shadow="md" p={{ base: 4, md: 6 }} w="100%">
          <Heading as="h1" size={{ base: "lg", md: "xl" }} textAlign="center" mb={6} color="gray.800">
            YouTube 링크 추출기
          </Heading>
          
          <Box display="flex" justifyContent="flex-end" mb={6}>
            {!authStatus ? (
              <Button
                onClick={initYouTubeAuth}
                colorScheme="blue"
                size={{ base: "sm", md: "md" }}
              >
                Google 로그인
              </Button>
            ) : (
              <Button
                onClick={logout}
                colorScheme="red"
                size={{ base: "sm", md: "md" }}
              >
                로그아웃
              </Button>
            )}
          </Box>

          {authStatus && (
            <Box mb={6}>
              <Heading as="h2" size={{ base: "sm", md: "md" }} mb={2} color="gray.700">
                재생목록 선택:
              </Heading>
              {isLoadingPlaylists ? (
                <Text color="gray.600">재생목록을 불러오는 중...</Text>
              ) : (
                <Select
                  value={selectedPlaylistId}
                  onChange={(e) => setSelectedPlaylistId(e.target.value)}
                  placeholder="재생목록을 선택하세요"
                  size={{ base: "md", md: "lg" }}
                >
                  {playlists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>
                      {playlist.title} ({playlist.itemCount}개 동영상)
                    </option>
                  ))}
                </Select>
              )}
            </Box>
          )}

          <Box mb={6}>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="카카오톡 메시지를 여기에 붙여넣으세요"
              size={{ base: "md", md: "lg" }}
              height={{ base: "150px", md: "200px" }}
              resize="none"
            />
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button
                onClick={extractLinks}
                colorScheme="green"
                size={{ base: "sm", md: "md" }}
              >
                링크 추출
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert status="error" mb={6} rounded="md">
              <WarningIcon mr={2} />
              {error}
            </Alert>
          )}

          {extractedLinks.length > 0 && (
            <VStack align="stretch" spacing={4}>
              <Heading as="h2" size={{ base: "sm", md: "md" }} color="gray.700">
                추출된 링크:
              </Heading>
              <List spacing={2}>
                {extractedLinks.map((link, index) => (
                  <ListItem key={index} p={3} bg="gray.50" rounded="md">
                    <Link
                      href={link}
                      isExternal
                      color="blue.500"
                      _hover={{ color: 'blue.600', textDecoration: 'underline' }}
                      wordBreak="break-all"
                      fontSize={{ base: "sm", md: "md" }}
                    >
                      {link}
                    </Link>
                  </ListItem>
                ))}
              </List>
              <Box display="flex" justifyContent="flex-end">
                <Button
                  onClick={handleUpdatePlaylist}
                  colorScheme="purple"
                  size={{ base: "sm", md: "md" }}
                >
                  재생목록 업데이트
                </Button>
              </Box>
            </VStack>
          )}
        </Box>
      </Container>
    </Box>
  );
} 